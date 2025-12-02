"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/session-context";
import { useToast } from "@/lib/toast-context";
import {
  askAI,
  SOCRATIC_SYSTEM_PROMPT,
  buildConversationContext,
  MessageRole,
} from "@/lib/ai-client";
import {
  Bot,
  Sparkles,
  Loader2,
  Check,
  Plus,
  Pin,
  Coffee,
  Volume2,
  VolumeX,
  Eye,
} from "lucide-react";
import { STICKY_COLORS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "@/components/voice-input";
import { VoiceCommand } from "@/lib/voice-commands";
import {
  speak,
  stopSpeaking,
  isSpeechSynthesisSupported,
  isCurrentlySpeaking,
} from "@/lib/speech";
import { findNonOverlappingPosition } from "@/lib/utils";

// Stuck detection: nudge messages when user hasn't added notes in 5 minutes
const STUCK_NUDGE_MESSAGES = [
  "Feeling stuck? Let's try a different angle 🔄",
  "Take a breath! What's one wild idea you haven't explored? 🌟",
  "Sometimes the best ideas come from constraints—what if you couldn't use technology?",
  "What would a 5-year-old suggest for this problem? 👶",
  "Flip it: What's the opposite of what you've been thinking?",
  "What's the most obvious solution you've been avoiding?",
];

const STUCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function AIQuestionPanel() {
  const {
    state,
    addQuestion,
    addNote,
    markQuestionAnswered,
    toggleQuestionAnswered,
    toggleQuestionPinned,
    setVoiceMode,
    setLastSpokenText,
    setVoiceTranscript,
    updateNote,
    deleteNote,
  } = useSession();
  const { showToast } = useToast();
  // Use a ref to ensure trySpeak always reads the latest state (avoids stale closures)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stuckNudge, setStuckNudge] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const hasAskedFirstQuestion = useRef(false);
  const lastNoteCountRef = useRef(state.notes.length);
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCreatedNoteIdRef = useRef<string | null>(null);

  const trySpeak = useCallback(
    async (text: string) => {
      if (!isSpeechSynthesisSupported()) {
        showToast("🔈 Browser does not support speech synthesis");
        return;
      }
      if (!stateRef.current.voiceOutputEnabled) {
        showToast(
          "🔇 AI voice output is turned off. Enable it in Settings to hear the AI."
        );
        return;
      }
      if (isMuted) {
        showToast("🔇 AI voice is muted in this chat");
        return;
      }
      // If voice mode is active, wait briefly for it to clear before speaking.
      // This handles the common race where the user issues a voice command and
      // releases the push-to-talk slightly before we try to speak.
      const maxWaitMs = 800;
      const pollInterval = 50;
      let waited = 0;
      while (stateRef.current.voiceMode && waited < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        waited += pollInterval;
      }
      if (stateRef.current.voiceMode) {
        // Still in voice mode — don't attempt to speak.
        showToast("🔇 AI voice is paused while you're recording");
        return;
      }
      try {
        await speak(text);
      } catch (error) {
        // Speech failed, but we don't need to set state anymore
        console.warn("Speech synthesis failed:", error);
      }
    },
    [showToast, isMuted]
  );

  // Keep stateRef in sync with current state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentQuestion = state.questions[state.questions.length - 1];

  // Stuck detection: reset timer when notes change
  const resetStuckTimer = useCallback(() => {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
    }
    setStuckNudge(null);

    stuckTimerRef.current = setTimeout(() => {
      const randomNudge =
        STUCK_NUDGE_MESSAGES[
          Math.floor(Math.random() * STUCK_NUDGE_MESSAGES.length)
        ];
      setStuckNudge(randomNudge);
    }, STUCK_TIMEOUT_MS);
  }, []);

  // Watch for note changes to reset stuck timer
  useEffect(() => {
    if (state.notes.length !== lastNoteCountRef.current) {
      lastNoteCountRef.current = state.notes.length;
      resetStuckTimer();
    }
  }, [state.notes.length, resetStuckTimer]);

  // Initialize stuck timer on mount
  useEffect(() => {
    resetStuckTimer();
    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }
    };
  }, [resetStuckTimer]);

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    // Auto-ask first question when canvas loads (only once)
    if (
      !hasAskedFirstQuestion.current &&
      state.questions.length === 0 &&
      state.hmwStatement
    ) {
      hasAskedFirstQuestion.current = true;
      askFirstQuestion();
    }
  }, [state.hmwStatement, state.questions.length]);

  const askFirstQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const context = buildConversationContext(
        stateRef.current.hmwStatement,
        [],
        []
      );

      const response = await askAI([
        { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nThis is the beginning of our ideation session. Ask me an opening question to help me start exploring this design challenge.`,
        },
      ]);

      addQuestion({
        id: `q-${Date.now()}`,
        text: response,
        fromAI: true,
        answered: false,
        timestamp: Date.now(),
      });

      // Auto-speak first AI response if voice output is enabled and user is not currently recording
      trySpeak(response);
    } catch (err) {
      setError(
        "Failed to get question from AI. Make sure LM Studio is running."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const askNextQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const recentNotes = stateRef.current.notes.slice(-5);
      const concepts = stateRef.current.concepts.map((c) => ({
        title: c.title,
        description: c.description,
      }));

      const context = buildConversationContext(
        stateRef.current.hmwStatement,
        recentNotes,
        concepts
      );

      // Build conversation history
      const messages: Array<{ role: MessageRole; content: string }> = [
        { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
        { role: "user", content: context },
      ];

      // Add recent Q&A history
      const recentQuestions = stateRef.current.questions.slice(-3);
      recentQuestions.forEach((q) => {
        const role: MessageRole = q.fromAI ? "assistant" : "user";
        messages.push({
          role,
          content: q.text,
        });
      });

      messages.push({
        role: "user" as const,
        content:
          "Based on my recent notes and progress, ask me a provocative, open-ended question using the SCAMPER method or another lateral thinking technique to help me expand my concepts. Focus on the most recent ideas added.",
      });

      const response = await askAI(messages);

      addQuestion({
        id: `q-${Date.now()}`,
        text: response,
        fromAI: true,
        answered: false,
        timestamp: Date.now(),
      });

      // Auto-speak AI response if voice output is enabled and user is not currently recording
      trySpeak(response);
    } catch (err) {
      setError("Failed to get next question from AI.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const delveDeeper = async () => {
    if (stateRef.current.notes.length === 0) {
      showToast("No notes to delve into yet!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lastNote =
        stateRef.current.notes[stateRef.current.notes.length - 1];
      const concepts = stateRef.current.concepts.map((c) => ({
        title: c.title,
        description: c.description,
      }));

      const context = buildConversationContext(
        stateRef.current.hmwStatement,
        [lastNote],
        concepts
      );

      // Build conversation history
      const messages: Array<{ role: MessageRole; content: string }> = [
        { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
        { role: "user", content: context },
      ];

      // Add recent Q&A history
      const recentQuestions = stateRef.current.questions.slice(-3);
      recentQuestions.forEach((q) => {
        const role: MessageRole = q.fromAI ? "assistant" : "user";
        messages.push({
          role,
          content: q.text,
        });
      });

      messages.push({
        role: "user" as const,
        content: `The user just added this note: "${lastNote.text}". Help them develop this idea deeper using Socratic questioning. Ask a thought-provoking question that encourages them to explore this concept further, perhaps by challenging assumptions, asking for specifics, or suggesting implications.`,
      });

      const response = await askAI(messages);

      addQuestion({
        id: `q-${Date.now()}`,
        text: response,
        fromAI: true,
        answered: false,
        timestamp: Date.now(),
      });

      // Auto-speak AI response if voice output is enabled and user is not currently recording
      trySpeak(response);
    } catch (err) {
      setError("Failed to get delve deeper question from AI.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice transcripts
  const handleVoiceTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      setVoiceTranscript(transcript);
      if (isFinal) {
        setLastSpokenText(transcript);
        // Automatically add note for any spoken text
        if (transcript && transcript.trim()) {
          const viewportCenterX = state.viewport?.centerX;
          const viewportCenterY = state.viewport?.centerY;
          const preferredX =
            viewportCenterX !== undefined
              ? viewportCenterX
              : 80 + Math.floor(Math.random() * 200);
          const preferredY =
            viewportCenterY !== undefined
              ? viewportCenterY
              : 80 + Math.floor(Math.random() * 120);

          const { x, y } = findNonOverlappingPosition(
            stateRef.current.notes,
            preferredX,
            preferredY
          );

          const noteId = `note-${Date.now()}`;
          addNote({
            id: noteId,
            text: transcript.trim(),
            x,
            y,
            color:
              STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
            isConcept: false,
            createdAt: Date.now(),
          });
          lastCreatedNoteIdRef.current = noteId;
          showToast("📝 Note saved!");
          trySpeak("Note saved");
        }
      }
    },
    [
      setLastSpokenText,
      setVoiceTranscript,
      state.viewport,
      state.notes,
      addNote,
      showToast,
    ]
  );

  // Handle voice commands
  const handleVoiceCommand = useCallback(
    (command: VoiceCommand, fullTranscript: string) => {
      setVoiceTranscript("");

      switch (command.type) {
        case "save-note": {
          // Use the payload (text before command) or the last spoken text
          const noteText =
            command.payload || state.lastSpokenText || fullTranscript;
          if (noteText && noteText.trim()) {
            const viewportCenterX = state.viewport?.centerX;
            const viewportCenterY = state.viewport?.centerY;
            const preferredX =
              viewportCenterX !== undefined
                ? viewportCenterX
                : 80 + Math.floor(Math.random() * 200);
            const preferredY =
              viewportCenterY !== undefined
                ? viewportCenterY
                : 80 + Math.floor(Math.random() * 120);

            const { x, y } = findNonOverlappingPosition(
              stateRef.current.notes,
              preferredX,
              preferredY
            );

            const noteId = `note-${Date.now()}`;
            addNote({
              id: noteId,
              text: noteText.trim(),
              x,
              y,
              color:
                STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
              isConcept: false,
              createdAt: Date.now(),
            });
            lastCreatedNoteIdRef.current = noteId;
            showToast("📝 Note saved!");
            trySpeak("Note saved");
          }
          break;
        }

        case "next-question": {
          // If we're currently in voice mode, ensure we exit push-to-talk *before*
          // asking the next question so the AI voice output is not blocked.
          // Small delay ensures recognition is stopped and state updates before TTS.
          setVoiceMode(false);
          showToast("🤔 Asking next question...");
          setTimeout(() => askNextQuestion(), 120);
          break;
        }

        case "delve-deeper": {
          // If we're currently in voice mode, ensure we exit push-to-talk *before*
          // delving deeper so the AI voice output is not blocked.
          // Small delay ensures recognition is stopped and state updates before TTS.
          setVoiceMode(false);
          showToast("🔍 Delving deeper...");
          setTimeout(() => delveDeeper(), 120);
          break;
        }

        case "stop-listening": {
          setVoiceMode(false);
          stopSpeaking();
          showToast("🔇 Voice mode off");
          break;
        }

        case "mark-concept": {
          // Mark the last created note as a concept
          // Use stateRef to get the current state (avoids stale closure)
          const currentNotes = stateRef.current.notes;
          if (lastCreatedNoteIdRef.current) {
            const note = currentNotes.find(
              (n) => n.id === lastCreatedNoteIdRef.current
            );
            if (note) {
              updateNote(note.id, { isConcept: true });
              showToast("⭐ Marked as concept!");
              trySpeak("Marked as concept");
            } else {
              showToast("Note no longer exists");
            }
          } else {
            showToast("No recent note to mark as concept");
          }
          break;
        }

        case "delete-note": {
          // Delete the most recent note
          const currentNotes = stateRef.current.notes;
          if (currentNotes.length > 0) {
            // Find the note with the latest createdAt timestamp
            const mostRecentNote = currentNotes.reduce((latest, note) =>
              note.createdAt > latest.createdAt ? note : latest
            );
            deleteNote(mostRecentNote);
            showToast("🗑️ Deleted last note!");
            trySpeak("Deleted last note");
          } else {
            showToast("No notes to delete");
          }
          break;
        }
      }
    },
    [state, addNote, setVoiceMode, setLastSpokenText, showToast, updateNote]
  );

  // Voice toggle is now handled by the canvas floating toolbar (spacebar or mic button)

  return (
    <div className="bg-gradient-to-b from-white to-blue-50/30 border-r-4 border-blue-200 w-80 flex flex-col order-first shadow-xl z-10">
      <div className="p-4 border-b-3 border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50">
        {/* Clean, minimal header */}
        <div className="flex items-center justify-between">
          {/* Bot Identity */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-teal-100 p-2 rounded-2xl shadow-md">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
            </div>
            <div>
              <h2 className="font-black text-gray-800 text-base">
                Socratic Guide
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {isLoading
                  ? "🤔 Thinking..."
                  : isCurrentlySpeaking()
                  ? "🗣️ Speaking..."
                  : state.voiceMode
                  ? "🎤 Listening..."
                  : isMuted
                  ? "🔇 Muted"
                  : "✨ Ready to help"}
              </p>
            </div>
          </div>

          {/* Mute Button Only */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
            aria-label={isMuted ? "Unmute AI voice" : "Mute AI voice"}
            className={`p-2 rounded-xl hover:scale-110 transition-all shadow-sm ${
              isMuted
                ? "text-red-500 bg-red-100 border border-red-200"
                : "text-gray-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Voice recognition engine - UI is in canvas floating toolbar, recognition logic handled here */}
        <div style={{ display: "none" }}>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onCommand={handleVoiceCommand}
            isEnabled={state.voiceMode || false}
            onToggle={() => setVoiceMode(!state.voiceMode)}
            isMuted={isCurrentlySpeaking()}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-blue-50/30">
        {isLoading && (
          <div className="flex items-center justify-center gap-3 text-teal-600 py-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-md border-3 border-blue-200 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-black">Thinking... 🤔</span>
          </div>
        )}

        {state.questions.length === 0 && !isLoading && (
          <div className="text-center text-gray-600 text-sm py-12">
            <div className="bg-gradient-to-br from-blue-100 to-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-10 h-10 text-teal-500" />
            </div>
            <p className="font-black text-lg mb-2">Ready to explore! ✨</p>
            <p className="font-semibold text-gray-500">
              Your AI mentor will ask you questions to guide your ideation
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {(() => {
            // display pinned questions first, then newest questions on top
            const sortedQuestions = [...state.questions].sort((a, b) => {
              if (a.pinned && b.pinned) {
                return b.timestamp - a.timestamp; // newest pinned first
              }
              if (a.pinned) return -1;
              if (b.pinned) return 1;
              return b.timestamp - a.timestamp; // newest unpinned first
            });
            return sortedQuestions.map((question) => (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.14 }}
                className={`p-5 rounded-2xl flex items-start gap-3 shadow-md hover:shadow-lg transition-all ${
                  question.pinned
                    ? "bg-gradient-to-br from-white to-amber-50 border-3 border-amber-200 ring-2 ring-amber-100"
                    : question.fromAI
                    ? "bg-gradient-to-br from-white to-blue-50 border-3 border-blue-200"
                    : "bg-gradient-to-br from-white to-gray-50 border-3 border-gray-200"
                } ${question.answered ? "opacity-50" : ""}`}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2 w-full">
                    <p className="text-sm text-gray-800 font-bold leading-relaxed">
                      {question.text}
                    </p>
                    {question.pinned && <span className="sr-only">Pinned</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-bold">
                    <span
                      title={new Date(question.timestamp).toLocaleString()}
                      aria-hidden="true"
                    >
                      {timeAgo(question.timestamp)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <motion.button
                    title={question.pinned ? "Unpin question" : "Pin question"}
                    aria-label={
                      question.pinned ? "Unpin question" : "Pin question"
                    }
                    aria-pressed={question.pinned}
                    onClick={() => toggleQuestionPinned(question.id)}
                    className={`p-2 rounded-xl hover:scale-110 transition-all shadow-sm ${
                      question.pinned
                        ? "text-amber-500 bg-amber-100"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait">
                      {question.pinned ? (
                        <motion.span
                          key="pinned"
                          initial={{ scale: 0, rotate: -10, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, rotate: 10, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center"
                        >
                          <Pin className="w-4 h-4 fill-current" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="unpinned"
                          initial={{ scale: 0, rotate: 10, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, rotate: -10, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center"
                        >
                          <Pin className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <button
                    title="Create note from question"
                    aria-label="Create note from question"
                    onClick={() => {
                      // Place note near the user's current viewport center (if available)
                      // Using collision detection to avoid overlapping
                      const viewportCenterX = state.viewport?.centerX;
                      const viewportCenterY = state.viewport?.centerY;

                      const preferredX =
                        viewportCenterX !== undefined
                          ? viewportCenterX
                          : 80 + Math.floor(Math.random() * 200);
                      const preferredY =
                        viewportCenterY !== undefined
                          ? viewportCenterY
                          : 80 + Math.floor(Math.random() * 120);

                      const { x, y } = findNonOverlappingPosition(
                        state.notes,
                        preferredX,
                        preferredY
                      );

                      addNote({
                        id: `note-${Date.now()}`,
                        text: question.text,
                        x,
                        y,
                        color:
                          STICKY_COLORS[
                            Math.floor(Math.random() * STICKY_COLORS.length)
                          ],
                        isConcept: false,
                        createdAt: Date.now(),
                      });
                    }}
                    className="p-2 rounded-xl hover:bg-teal-100 hover:scale-110 transition-all text-gray-400 hover:text-teal-600 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <motion.button
                    onClick={() => {
                      const wasAnswered = question.answered;
                      toggleQuestionAnswered(question.id);
                      if (!wasAnswered) {
                        // If marking as answered, trigger the next question
                        // Small delay to allow the UI to update first
                        setTimeout(() => askNextQuestion(), 500);
                      }
                    }}
                    title={
                      question.answered
                        ? "Mark as unanswered"
                        : "Mark as answered"
                    }
                    aria-label={
                      question.answered
                        ? "Mark as unanswered"
                        : "Mark as answered"
                    }
                    whileTap={{ scale: 0.9 }}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={
                      question.answered
                        ? { scale: 1.05, opacity: 1 }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                    className={`p-2 rounded-xl transition-all shadow-sm hover:scale-110 ${
                      question.answered
                        ? "text-green-600 bg-green-100"
                        : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ));
          })()}
        </AnimatePresence>

        {error && (
          <div className="p-4 bg-red-50 border-3 border-red-200 rounded-2xl shadow-md">
            <p className="text-sm text-red-600 font-black">{error}</p>
          </div>
        )}

        {/* Stuck Nudge - appears after 5 minutes of inactivity */}
        {stuckNudge && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-amber-300 rounded-2xl shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-xl">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 mb-2">
                  {stuckNudge}
                </p>
                <button
                  onClick={() => {
                    setStuckNudge(null);
                    resetStuckTimer();
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700 font-bold underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-5 border-t-3 border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col gap-2">
          <button
            onClick={askNextQuestion}
            disabled={isLoading || stateRef.current.notes.length === 0}
            className="fun-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-teal"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-black">
              {isLoading ? "Thinking... 🤔" : "Ask Next Question"}
            </span>
          </button>
          <button
            onClick={delveDeeper}
            disabled={isLoading || stateRef.current.notes.length === 0}
            className="flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg text-white font-bold border-none rounded-2xl px-6 py-3 transition-all hover:scale-105 hover:shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)",
              backgroundSize: "200% 200%",
              animation: "gradientFlow 3s ease infinite",
              boxShadow:
                "0 8px 16px rgba(139, 92, 246, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Eye className="w-5 h-5" />
            <span className="font-black">
              {isLoading ? "Thinking... 🤔" : "Delve Deeper"}
            </span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center font-bold">
          {stateRef.current.notes.length === 0
            ? "✏️ Add some notes to get started"
            : "🚀 Get the next guiding question or deepen your ideas"}
        </p>
      </div>
    </div>
  );
}
