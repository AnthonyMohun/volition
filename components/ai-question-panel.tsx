"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/session-context";
import { useToast } from "@/lib/toast-context";
import {
  askAI,
  SOCRATIC_SYSTEM_PROMPT,
  OPENING_QUESTIONS,
  DEEPENING_QUESTIONS,
  EXPANSION_QUESTIONS,
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
  PanelLeftClose,
  PanelLeftOpen,
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

interface AIQuestionPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AIQuestionPanel({
  isCollapsed = false,
  onToggleCollapse,
}: AIQuestionPanelProps) {
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
          content: `${context}\n\nAsk me ONE opening question to start generating concepts. Focus on understanding the problem space or target users. Keep it under 15 words. Just the question, nothing else.`,
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
          "Based on my notes, ask ONE question that helps me develop a concrete concept. Focus on: features, users, or how it works. Under 15 words. Just the question.",
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
          // Note: Delve deeper is now per-note, but we can still support the voice command
          // by showing a toast directing user to use the button on individual notes
          showToast(
            "💡 Use the 'Delve Deeper' button on any note to explore that idea!"
          );
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

  // Collapsed state FAB for iPad - shows when panel is collapsed
  if (isCollapsed) {
    return (
      <>
        {/* Collapsed FAB */}
        <button
          onClick={onToggleCollapse}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-30 fab bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-lg hover:shadow-xl transition-all"
          aria-label="Open AI panel"
        >
          <PanelLeftOpen className="w-6 h-6" />
        </button>

        {/* Hidden voice input still needs to run */}
        <div style={{ display: "none" }}>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onCommand={handleVoiceCommand}
            isEnabled={state.voiceMode || false}
            onToggle={() => setVoiceMode(!state.voiceMode)}
            isMuted={isCurrentlySpeaking()}
          />
        </div>
      </>
    );
  }

  return (
    <div
      className={`flex flex-col order-first z-10 sidebar-collapsible ${
        isCollapsed ? "sidebar-collapsed" : "w-80 md:w-72 lg:w-80"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
        borderRight: "2px solid rgba(255, 255, 255, 0.6)",
        boxShadow: `
          4px 0 16px rgba(163, 177, 198, 0.2),
          inset -1px 0 2px rgba(163, 177, 198, 0.08),
          inset 1px 0 2px rgba(255, 255, 255, 0.8)
        `,
      }}
    >
      {/* Header */}
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,249,255,0.8) 0%, rgba(240,253,250,0.6) 100%)",
          borderBottom: "1px solid rgba(186, 230, 253, 0.4)",
        }}
      >
        {/* Clean, minimal header */}
        <div className="flex items-center justify-between">
          {/* Bot Identity */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(204,251,241,1) 100%)",
                  boxShadow: `
                    0 2px 8px rgba(20, 184, 166, 0.15),
                    inset 0 1px 2px rgba(255, 255, 255, 0.8)
                  `,
                }}
              >
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm">
                Socratic Guide
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {isLoading
                  ? "Thinking..."
                  : isCurrentlySpeaking()
                  ? "Speaking..."
                  : state.voiceMode
                  ? "Listening..."
                  : isMuted
                  ? "Muted"
                  : "Ready"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
              aria-label={isMuted ? "Unmute AI voice" : "Mute AI voice"}
              className={`p-2 rounded-xl transition-all ${
                isMuted
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Collapse button for iPad */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse panel"
                aria-label="Collapse AI panel"
                className="p-2 rounded-xl transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-600 hidden md:flex lg:hidden"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
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

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div
            className="flex items-center justify-center gap-2 py-4 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(240,249,255,0.8) 0%, rgba(240,253,250,0.6) 100%)",
              border: "1px solid rgba(186, 230, 253, 0.5)",
            }}
          >
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-sm font-semibold text-gray-600">
              Thinking...
            </span>
          </div>
        )}

        {state.questions.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(240,249,255,1) 0%, rgba(204,251,241,1) 100%)",
                boxShadow: "0 2px 8px rgba(20, 184, 166, 0.15)",
              }}
            >
              <Sparkles className="w-7 h-7 text-teal-500" />
            </div>
            <p className="font-bold text-gray-700 text-sm mb-1">
              Ready to explore!
            </p>
            <p className="text-xs text-gray-500">
              Questions will appear here to guide your ideation
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
                className={`p-4 rounded-xl flex items-start gap-3 transition-all ${
                  question.answered ? "opacity-50" : ""
                }`}
                style={{
                  background: question.pinned
                    ? "linear-gradient(135deg, rgba(255,251,235,0.9) 0%, rgba(254,243,199,0.7) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
                  border: question.pinned
                    ? "1px solid rgba(251, 191, 36, 0.3)"
                    : "1px solid rgba(226, 232, 240, 0.8)",
                  boxShadow: `
                    0 2px 8px rgba(163, 177, 198, 0.12),
                    inset 0 1px 2px rgba(255, 255, 255, 0.8)
                  `,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    {question.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {timeAgo(question.timestamp)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <motion.button
                    title={question.pinned ? "Unpin question" : "Pin question"}
                    aria-label={
                      question.pinned ? "Unpin question" : "Pin question"
                    }
                    aria-pressed={question.pinned}
                    onClick={() => toggleQuestionPinned(question.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                      question.pinned
                        ? "text-amber-500 bg-amber-100/80"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pin
                      className={`w-3.5 h-3.5 ${
                        question.pinned ? "fill-current" : ""
                      }`}
                    />
                  </motion.button>

                  <button
                    title="Create note from question"
                    aria-label="Create note from question"
                    onClick={() => {
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
                        text: "",
                        x,
                        y,
                        color:
                          STICKY_COLORS[
                            Math.floor(Math.random() * STICKY_COLORS.length)
                          ],
                        isConcept: false,
                        createdAt: Date.now(),
                        questionId: question.id,
                        sourceQuestion: question.text,
                        isNewNote: true,
                      });
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <motion.button
                    onClick={() => {
                      const wasAnswered = question.answered;
                      toggleQuestionAnswered(question.id);
                      if (!wasAnswered) {
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
                    className={`p-1.5 rounded-lg transition-all ${
                      question.answered
                        ? "text-green-600 bg-green-100/80"
                        : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ));
          })()}
        </AnimatePresence>

        {error && (
          <div
            className="p-3 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(254,242,242,0.9) 0%, rgba(254,226,226,0.7) 100%)",
              border: "1px solid rgba(248, 113, 113, 0.3)",
            }}
          >
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Stuck Nudge - appears after 5 minutes of inactivity */}
        {stuckNudge && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-4 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,251,235,0.9) 0%, rgba(254,243,199,0.7) 100%)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              boxShadow: "0 2px 8px rgba(251, 191, 36, 0.1)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(251, 191, 36, 0.15)" }}
              >
                <Coffee className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  {stuckNudge}
                </p>
                <button
                  onClick={() => {
                    setStuckNudge(null);
                    resetStuckTimer();
                  }}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4"
        style={{
          borderTop: "2px solid rgba(219, 234, 254, 0.6)",
          background:
            "linear-gradient(180deg, rgba(240,253,250,0.6) 0%, rgba(239,246,255,0.8) 100%)",
        }}
      >
        <button
          onClick={askNextQuestion}
          disabled={isLoading || stateRef.current.notes.length === 0}
          className="fun-button-primary w-full flex items-center justify-center gap-2 !py-2.5 !px-4 !rounded-xl !text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:transform-none"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? "Thinking..." : "Ask Next Question"}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2.5 text-center">
          {stateRef.current.notes.length === 0
            ? "Add some notes to get started"
            : "Use 'Delve Deeper' on any note to explore ideas"}
        </p>
      </div>
    </div>
  );
}
