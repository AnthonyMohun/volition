"use client";

import { MessageSquare, Lightbulb, Sparkles, ArrowRight } from "lucide-react";

export function WhatIsSlide() {
  const steps = [
    {
      icon: MessageSquare,
      label: "Question",
      description: "Prompts that spark reflection",
      color: "from-blue-100 to-blue-200 text-blue-600",
    },
    {
      icon: Lightbulb,
      label: "Explore",
      description: "Discover new paths",
      color: "from-amber-100 to-yellow-200 text-amber-600",
    },
    {
      icon: Sparkles,
      label: "Insight",
      description: "Form clear concepts",
      color: "from-teal-100 to-teal-200 text-teal-600",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Meet Volition</h2>
      <p className="text-4xl text-gray-500 mb-16 max-w-5xl text-center">
        A <span className="font-black text-teal-600">Socratic companion</span>{" "}
        that guides better ideas through better questions
      </p>

      {/* Process visualization - all animate together */}
      <div className="fragment fade-up flex items-center justify-center gap-10">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-6`}
                >
                  <Icon className="w-16 h-16" />
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-3">
                  {step.label}
                </h3>
                <p className="text-xl text-gray-500 font-medium text-center">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-8">
                  <ArrowRight className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key insight */}
      <p className="fragment fade-up mt-16 text-3xl font-bold text-teal-600">
        🧠 Learning by asking, not telling
      </p>
    </div>
  );
}
