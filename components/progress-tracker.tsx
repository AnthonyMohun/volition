"use client";

import { useSession } from "@/lib/session-context";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  emoji: string;
  phase: string;
  qualityCheck?: (state: ReturnType<typeof useSession>["state"]) => {
    met: boolean;
    label: string;
  };
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: "hmw",
    label: "Define Challenge",
    emoji: "💭",
    phase: "hmw",
    qualityCheck: (state) => ({
      met: state.hmwStatement.length > 20,
      label: "Clear HMW statement",
    }),
  },
  {
    id: "canvas",
    label: "Generate Ideas",
    emoji: "🎨",
    phase: "canvas",
    qualityCheck: (state) => ({
      met: state.notes.filter((n) => n.isConcept).length >= 2,
      label: `${state.notes.filter((n) => n.isConcept).length} concepts marked`,
    }),
  },
  {
    id: "select",
    label: "Select Best",
    emoji: "🎯",
    phase: "select",
    qualityCheck: (state) => ({
      met: state.selectedConceptIds.length >= 2,
      label: `${state.selectedConceptIds.length} concepts selected`,
    }),
  },
  {
    id: "refine",
    label: "Refine Details",
    emoji: "✨",
    phase: "refine",
    qualityCheck: (state) => {
      const selectedNotes = state.notes.filter((n) =>
        state.selectedConceptIds.includes(n.id)
      );
      const withDetails = selectedNotes.filter(
        (n) => n.details && n.details.trim().length > 0
      );
      return {
        met:
          withDetails.length === selectedNotes.length &&
          selectedNotes.length > 0,
        label: `${withDetails.length}/${selectedNotes.length} with details`,
      };
    },
  },
  {
    id: "final",
    label: "Evaluate & Export",
    emoji: "🚀",
    phase: "final",
    qualityCheck: (state) => ({
      met: state.evaluations.length > 0,
      label: "Evaluation complete",
    }),
  },
];

const PHASE_ORDER = ["hmw", "canvas", "select", "refine", "final"];

const ENCOURAGING_MESSAGES: Record<string, string[]> = {
  hmw: [
    "Great start! A clear challenge is half the battle 💪",
    "You've defined your challenge—now the fun begins!",
  ],
  canvas: [
    "Ideas are flowing! Keep exploring 🌊",
    "Every note brings you closer to something great",
    "You're building something amazing here ✨",
  ],
  select: [
    "Choosing is hard—trust your instincts! 🎯",
    "Your best ideas deserve the spotlight",
  ],
  refine: [
    "Adding depth makes all the difference 💎",
    "Details turn good ideas into great ones",
  ],
  final: [
    "You made it! Time to see how strong your concepts are 🏆",
    "Almost there—finish strong! 💪",
  ],
};

interface ProgressTrackerProps {
  variant?: "full" | "compact";
  showEncouragement?: boolean;
}

export function ProgressTracker({
  variant = "full",
  showEncouragement = true,
}: ProgressTrackerProps) {
  const { state } = useSession();
  const currentPhaseIndex = PHASE_ORDER.indexOf(state.currentPhase);

  const getRandomMessage = (phase: string) => {
    const messages = ENCOURAGING_MESSAGES[phase] || [];
    return messages[Math.floor(Math.random() * messages.length)] || "";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-blue-200 shadow-sm">
        {PROGRESS_STEPS.map((step, index) => {
          const isComplete = index < currentPhaseIndex;
          const isCurrent = step.phase === state.currentPhase;
          const qualityResult = step.qualityCheck?.(state);

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-gradient-to-br from-blue-100 to-teal-100 border-2 border-blue-300"
                    : isComplete
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <span className="text-sm">{step.emoji}</span>
                {isComplete && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                )}
                {isCurrent && qualityResult?.met && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                )}
              </div>
              {index < PROGRESS_STEPS.length - 1 && (
                <ArrowRight
                  className={`w-3 h-3 mx-1 ${
                    index < currentPhaseIndex
                      ? "text-green-400"
                      : "text-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fun-card p-5 border-3 border-blue-200 bg-gradient-to-br from-white to-blue-50/50">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-4">
        {PROGRESS_STEPS.map((step, index) => {
          const isComplete = index < currentPhaseIndex;
          const isCurrent = step.phase === state.currentPhase;
          const qualityResult = step.qualityCheck?.(state);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-blue-400 to-teal-400 text-white shadow-lg scale-110 ring-4 ring-blue-200"
                      : isComplete
                      ? "bg-gradient-to-br from-green-100 to-green-200 text-green-600 shadow-md"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span>{step.emoji}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold mt-2 text-center ${
                    isCurrent
                      ? "text-teal-700"
                      : isComplete
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && qualityResult && (
                  <span
                    className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                      qualityResult.met
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {qualityResult.label}
                  </span>
                )}
              </div>
              {index < PROGRESS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    index < currentPhaseIndex
                      ? "bg-gradient-to-r from-green-300 to-green-400"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Encouragement Message */}
      {showEncouragement && (
        <div className="mt-4 pt-4 border-t-2 border-blue-100">
          <p className="text-sm text-teal-700 font-semibold text-center animate-pulse">
            {getRandomMessage(state.currentPhase)}
          </p>
        </div>
      )}
    </div>
  );
}

// Quality summary for the current session
export function QualitySummary() {
  const { state } = useSession();

  const conceptCount = state.notes.filter((n) => n.isConcept).length;
  const notesWithDetails = state.notes.filter(
    (n) => n.details && n.details.trim().length > 0
  ).length;
  const questionsAnswered = state.questions.filter((q) => q.answered).length;

  const metrics = [
    {
      label: "Concepts",
      value: conceptCount,
      target: 3,
      emoji: "⭐",
      color: "yellow",
    },
    {
      label: "With Details",
      value: notesWithDetails,
      target: conceptCount,
      emoji: "📝",
      color: "blue",
    },
    {
      label: "Questions Explored",
      value: questionsAnswered,
      target: 5,
      emoji: "💬",
      color: "teal",
    },
  ];

  return (
    <div className="flex items-center gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-${metric.color}-50 border-2 border-${metric.color}-200`}
        >
          <span className="text-lg">{metric.emoji}</span>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {metric.label}
            </div>
            <div className="text-sm font-black text-gray-700">
              {metric.value}
              {metric.target > 0 && (
                <span className="text-gray-400">/{metric.target}</span>
              )}
            </div>
          </div>
          {metric.value >= metric.target && metric.target > 0 && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
      ))}
    </div>
  );
}
