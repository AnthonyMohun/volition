"use client";

import { AnimatedAIChat } from "@/lib/presentation-animations";
import { ArrowRight, Pin, Plus, Check } from "lucide-react";

export function HowToUse2Slide() {
  const actions = [
    {
      icon: ArrowRight,
      label: "Delve Deeper",
      desc: "Explore questions further",
      color: "text-blue-500",
    },
    {
      icon: Check,
      label: "Mark Answered",
      desc: "Track your progress",
      color: "text-green-500",
    },
    {
      icon: Pin,
      label: "Pin Important",
      desc: "Keep key insights visible",
      color: "text-amber-500",
    },
    {
      icon: Plus,
      label: "Add to Canvas",
      desc: "Create notes from questions",
      color: "text-teal-500",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">AI Guide</h2>
      <p className="text-3xl text-gray-500 mb-16">
        Socratic prompts that deepen your thinking
      </p>

      {/* Two column grid - left always visible, right has individual fragments */}
      <div className="grid grid-cols-2 gap-24 items-start">
        {/* Left column - Always visible chat preview */}
        <div className="flex justify-end">
          <AnimatedAIChat delay={0} />
        </div>

        {/* Right column - Each action is its own fragment */}
        <div className="space-y-8 text-left pt-4">
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="fragment fade-up"
              data-fragment-index={index}
            >
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-xl bg-gray-100 ${action.color}`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-800">
                    {action.label}
                  </h4>
                  <p className="text-lg text-gray-500">{action.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
