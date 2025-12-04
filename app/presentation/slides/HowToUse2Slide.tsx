"use client";

import { AnimatedAIChat } from "@/lib/presentation-animations";
import { ArrowRight, Pin, Plus, Check } from "lucide-react";

export function HowToUse2Slide() {
  const actions = [
    { icon: ArrowRight, label: "Delve Deeper", color: "text-blue-500" },
    { icon: Check, label: "Mark Answered", color: "text-green-500" },
    { icon: Pin, label: "Pin Important", color: "text-amber-500" },
    { icon: Plus, label: "Add to Canvas", color: "text-teal-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">AI Guide</h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-20">
        Thoughtful questions to deepen your thinking
      </p>

      <div className="flex items-start gap-24">
        {/* Animated chat */}
        <div className="fragment fade-right">
          <AnimatedAIChat delay={0} />
        </div>

        {/* Interaction options */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-gray-600 mb-10">
            Interact with questions
          </h3>

          <div className="grid grid-cols-2 gap-x-16 gap-y-10">
            {actions.map((action, i) => (
              <div
                key={action.label}
                className="fragment fade-up flex items-center gap-4"
                data-fragment-index={i + 1}
              >
                <action.icon className={`w-9 h-9 ${action.color}`} />
                <span className="font-bold text-xl text-gray-700">
                  {action.label}
                </span>
              </div>
            ))}
          </div>

          <p className="fragment fade-in text-xl text-gray-500 mt-10 pt-8 border-t border-gray-200">
            🧠 AI adapts based on your notes and progress
          </p>
        </div>
      </div>
    </div>
  );
}
