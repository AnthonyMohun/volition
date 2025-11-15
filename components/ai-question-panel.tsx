"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/session-context";
import {
  askAI,
  SOCRATIC_SYSTEM_PROMPT,
  buildConversationContext,
  MessageRole,
} from "@/lib/ai-client";
import { Bot, Sparkles, Loader2, Check, Plus, Pin } from "lucide-react";
import { STICKY_COLORS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

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
  // removed hover-based undo — replaced with a direct toggle and green transition
  const hasAskedFirstQuestion = useRef(false);

  const currentQuestion = state.questions[state.questions.length - 1];

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
          "Based on my recent notes and progress, what should I explore next?",
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
    <div className="glass border-l border-gray-800 w-80 flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-gray-100">AI Guide</h2>
        </div>
        <p className="text-xs text-gray-400">
          Socratic questioning to guide your exploration
        </p>
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
          <span>{state.questions.length} questions</span>
          <span className="text-purple-300">
            {state.questions.filter((q) => !q.answered).length} unanswered
          </span>
          {(() => {
            const pinnedCount = state.questions.filter((q) => q.pinned).length;
            return (
              <span
                className="ml-auto flex items-center gap-1 text-yellow-300 text-xs"
                aria-label={`${pinnedCount} pinned questions`}
              >
                <Pin className="w-3.5 h-3.5 opacity-90" />
                <span aria-hidden="true">{pinnedCount}</span>
                <span className="sr-only">{pinnedCount} pinned</span>
              </span>
            );
          })()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.questions.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400/50" />
            <p>Your AI mentor will ask you questions to guide your ideation</p>
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
                className={`p-3 rounded-lg ${
                  question.fromAI
                    ? "glass-light border border-purple-500/20"
                    : "glass-light border border-gray-700"
                } ${question.pinned ? "border-l-4 border-yellow-500/40" : ""}`}
              >
                <div className="flex items-start gap-2 w-full">
                  <p className="text-sm text-gray-200">{question.text}</p>
                  {question.pinned && <span className="sr-only">Pinned</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    <span
                      title={new Date(question.timestamp).toLocaleString()}
                      aria-hidden="true"
                      className="text-transparent"
                    >
                      {timeAgo(question.timestamp)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => toggleQuestionAnswered(question.id)}
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
                      whileTap={{ scale: 0.92 }}
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
                      className={`p-1.5 rounded transition-all ${
                        question.answered
                          ? "text-green-400"
                          : "text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>

                    <button
                      title="Create note from question"
                      aria-label="Create note from question"
                      onClick={() => {
                        addNote({
                          id: `note-${Date.now()}`,
                          text: question.text,
                          x: 80 + Math.floor(Math.random() * 200),
                          y: 80 + Math.floor(Math.random() * 120),
                          color:
                            STICKY_COLORS[
                              Math.floor(Math.random() * STICKY_COLORS.length)
                            ],
                          isConcept: false,
                          createdAt: Date.now(),
                        });
                      }}
                      className="p-1.5 rounded hover:bg-white/10 transition-all text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <motion.button
                      title={
                        question.pinned ? "Unpin question" : "Pin question"
                      }
                      aria-label={
                        question.pinned ? "Unpin question" : "Pin question"
                      }
                      aria-pressed={question.pinned}
                      onClick={() => toggleQuestionPinned(question.id)}
                      className={`p-1.5 rounded hover:bg-white/10 transition-all ${
                        question.pinned ? "text-yellow-300" : "text-gray-400"
                      }`}
                      whileTap={{ scale: 0.92 }}
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
                            <Pin className="w-4 h-4" />
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
                            <Pin className="w-4 h-4 opacity-70" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ));
          })()}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-purple-400 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {error && (
          <div className="p-3 glass-light border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 glass-light">
        <button
          onClick={askNextQuestion}
          disabled={isLoading || state.notes.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 silver-glow"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? "Thinking..." : "Ask Next Question"}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {state.notes.length === 0
            ? "Add some notes to get started"
            : "Get the next guiding question"}
        </p>
      </div>
    </div>
  );
}
