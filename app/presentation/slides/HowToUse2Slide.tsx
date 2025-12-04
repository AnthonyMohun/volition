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
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">AI Guide</h2>
      <p className="text-3xl text-gray-500 mb-16">
        Socratic prompts that deepen your thinking
      </p>

      {/* Two column grid with fixed widths */}
      <div className="fragment fade-up grid grid-cols-2 gap-24 items-start">
        {/* Left column - Animated chat */}
        <div className="flex justify-end">
          <AnimatedAIChat delay={0} />
        </div>

        {/* Right column - Interaction options */}
        <div className="pt-4">
          <h3 className="text-2xl font-bold text-gray-600 mb-10">
            Interact with questions
          </h3>

          <div className="grid grid-cols-2 gap-x-14 gap-y-8">
            {actions.map((action) => (
              <div key={action.label} className="flex items-center gap-4">
                <action.icon className={`w-8 h-8 ${action.color}`} />
                <span className="font-bold text-xl text-gray-700">
                  {action.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xl text-gray-500 mt-10 pt-8 border-t border-gray-200">
            🧠 AI adapts based on your notes and progress
          </p>
        </div>
      </div>
    </div>
  );
}
