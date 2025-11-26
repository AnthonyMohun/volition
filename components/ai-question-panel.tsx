"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/session-context";
import {
  askAI,
  SOCRATIC_SYSTEM_PROMPT,
  buildConversationContext,
  MessageRole,
} from "@/lib/ai-client";
import { Bot, Sparkles, Loader2, Check, Plus, Pin, Coffee } from "lucide-react";
import { STICKY_COLORS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

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
  } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stuckNudge, setStuckNudge] = useState<string | null>(null);
  const hasAskedFirstQuestion = useRef(false);
  const lastNoteCountRef = useRef(state.notes.length);
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [state.hmwStatement]);

  const askFirstQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const context = buildConversationContext(state.hmwStatement, [], []);

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
      const recentNotes = state.notes.slice(-5);
      const concepts = state.concepts.map((c) => ({
        title: c.title,
        description: c.description,
      }));

      const context = buildConversationContext(
        state.hmwStatement,
        recentNotes,
        concepts
      );

      // Build conversation history
      const messages: Array<{ role: MessageRole; content: string }> = [
        { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
        { role: "user", content: context },
      ];

      // Add recent Q&A history
      const recentQuestions = state.questions.slice(-3);
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
    } catch (err) {
      setError("Failed to get next question from AI.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-purple-50/30 border-r-4 border-purple-200 w-80 flex flex-col order-first shadow-xl z-10">
      <div className="p-5 border-b-3 border-purple-100 space-y-4 bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Bot Identifier */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-2xl shadow-md">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-3 border-white animate-pulse"></span>
          </div>
          <div className="flex-1">
            <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
              Socratic AI <span className="text-sm">🤖</span>
            </h2>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              ✓ Active & Ready
            </span>
          </div>
        </div>

        {/* HMW Statement */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-4 space-y-2 border-3 border-purple-200 shadow-lg">
          <p className="text-xs uppercase tracking-wider text-purple-600 font-black flex items-center gap-1">
            <span>💭</span> Design Challenge
          </p>
          <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed font-bold">
            {state.hmwStatement}
          </p>
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-600 flex items-center gap-3 pt-1 font-bold">
          <span className="flex items-center gap-1">
            <span className="text-base">💬</span>
            {state.questions.length}
          </span>
          <span className="text-purple-600 flex items-center gap-1">
            <span className="text-base">⏳</span>
            {state.questions.filter((q) => !q.answered).length}
          </span>
          {(() => {
            const pinnedCount = state.questions.filter((q) => q.pinned).length;
            return (
              <span
                className="ml-auto flex items-center gap-1 text-amber-500 text-xs"
                aria-label={`${pinnedCount} pinned questions`}
              >
                <Pin className="w-4 h-4 fill-current" />
                <span aria-hidden="true">{pinnedCount}</span>
                <span className="sr-only">{pinnedCount} pinned</span>
              </span>
            );
          })()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-purple-50/30">
        {state.questions.length === 0 && !isLoading && (
          <div className="text-center text-gray-600 text-sm py-12">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-10 h-10 text-purple-500" />
            </div>
            <p className="font-black text-lg mb-2">Ready to explore! ✨</p>
            <p className="font-semibold text-gray-500">
              Your AI mentor will ask you questions to guide your ideation
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {(() => {
            // display pinned questions first with an animated rearrange
            const sortedQuestions = [...state.questions].sort((a, b) => {
              if ((a.pinned ? 1 : 0) === (b.pinned ? 1 : 0)) {
                return a.timestamp - b.timestamp;
              }
              return b.pinned ? 1 : -1; // pinned questions to the top
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
                  question.fromAI
                    ? "bg-gradient-to-br from-white to-purple-50 border-3 border-purple-200"
                    : "bg-gradient-to-br from-white to-gray-50 border-3 border-gray-200"
                } ${
                  question.pinned
                    ? "border-l-[6px] border-l-amber-400 ring-2 ring-amber-200"
                    : ""
                }`}
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
                      // Using a subtle random offset to avoid strict stacking on the exact center
                      const viewportCenterX = state.viewport?.centerX;
                      const viewportCenterY = state.viewport?.centerY;

                      const offsetX = (Math.random() - 0.5) * 200;
                      const offsetY = (Math.random() - 0.5) * 120;

                      const x =
                        viewportCenterX !== undefined
                          ? viewportCenterX + offsetX
                          : 80 + Math.floor(Math.random() * 200);
                      const y =
                        viewportCenterY !== undefined
                          ? viewportCenterY + offsetY
                          : 80 + Math.floor(Math.random() * 120);

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
                    className="p-2 rounded-xl hover:bg-purple-100 hover:scale-110 transition-all text-gray-400 hover:text-purple-600 shadow-sm"
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

        {isLoading && (
          <div className="flex items-center justify-center gap-3 text-purple-600 py-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-md border-3 border-purple-200 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-black">Thinking... 🤔</span>
          </div>
        )}

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

      <div className="p-5 border-t-3 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
        <button
          onClick={askNextQuestion}
          disabled={isLoading || state.notes.length === 0}
          className="w-full fun-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-purple"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-black">
            {isLoading ? "Thinking... 🤔" : "Ask Next Question"}
          </span>
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center font-bold">
          {state.notes.length === 0
            ? "✏️ Add some notes to get started"
            : "🚀 Get the next guiding question"}
        </p>
      </div>
    </div>
  );
}
