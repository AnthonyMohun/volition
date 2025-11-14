"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/session-context";
import {
  askAI,
  SOCRATIC_SYSTEM_PROMPT,
  buildConversationContext,
  MessageRole,
} from "@/lib/ai-client";
import { Bot, Sparkles, Loader2 } from "lucide-react";

export function AIQuestionPanel() {
  const { state, addQuestion } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAskedFirstQuestion = useRef(false);

  const currentQuestion = state.questions[state.questions.length - 1];

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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.questions.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400/50" />
            <p>Your AI mentor will ask you questions to guide your ideation</p>
          </div>
        )}

        {state.questions.map((question) => (
          <div
            key={question.id}
            className={`p-3 rounded-lg ${
              question.fromAI
                ? "glass-light border border-purple-500/20"
                : "glass-light border border-gray-700"
            }`}
          >
            <div className="flex items-start gap-2">
              {question.fromAI && (
                <Bot className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm text-gray-200">{question.text}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(question.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}

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
