"use client";

import { AnimatedWorkflow } from "@/lib/presentation-animations";

export function HowToUse4Slide() {
  const stages = [
    { emoji: "💭", title: "Define", desc: "Write your HMW challenge" },
    { emoji: "🎨", title: "Ideate", desc: "Create notes, answer questions" },
    { emoji: "⭐", title: "Select", desc: "Pick your best concepts" },
    { emoji: "✨", title: "Refine", desc: "Add details to concepts" },
    { emoji: "🚀", title: "Export", desc: "Get AI evaluation & PDF" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">The Journey</h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-16">
        From challenge to polished concepts in 5 stages
      </p>

      {/* Animated workflow */}
      <div className="fragment fade-up mb-16">
        <AnimatedWorkflow delay={0} size="large" />
      </div>

      {/* Stage details */}
      <div className="flex gap-16 max-w-5xl">
        {stages.map((stage, index) => (
          <div
            key={stage.title}
            className="fragment fade-up text-center flex-1"
            data-fragment-index={index + 2}
          >
            <span className="text-5xl block mb-4">{stage.emoji}</span>
            <h4 className="font-bold text-gray-800 text-xl mb-2">
              {stage.title}
            </h4>
            <p className="text-lg text-gray-500">{stage.desc}</p>
          </div>
        ))}
      </div>

      <p className="fragment fade-in text-xl text-gray-500 mt-14">
        ✅ Guided progression keeps students on track
      </p>
    </div>
  );
}
