"use client";

import { MessageSquare, Lightbulb, Sparkles, ArrowRight } from "lucide-react";

export function WhatIsSlide() {
  const steps = [
    {
      icon: MessageSquare,
      label: "Question",
      description: "AI asks thought-provoking questions",
      color: "from-blue-100 to-blue-200 text-blue-600",
    },
    {
      icon: Lightbulb,
      label: "Explore",
      description: "Think deeper and discover",
      color: "from-amber-100 to-yellow-200 text-amber-600",
    },
    {
      icon: Sparkles,
      label: "Insight",
      description: "Emerge with stronger concepts",
      color: "from-teal-100 to-teal-200 text-teal-600",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-8">
        What is Volition?
      </h2>

      <p className="fragment fade-in text-3xl text-gray-600 mb-20 max-w-4xl text-center">
        A design ideation tool using the{" "}
        <span className="font-black text-teal-600">Socratic method</span> —
        guiding through questions, not answers
      </p>

      {/* Process visualization */}
      <div className="flex items-center justify-center gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div
                className={`fragment fade-up flex flex-col items-center`}
                data-fragment-index={index}
              >
                <div
                  className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-6`}
                >
                  <Icon className="w-16 h-16" />
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-3">
                  {step.label}
                </h3>
                <p className="text-xl text-gray-500 font-medium max-w-[200px] text-center">
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
      <p className="fragment fade-in mt-16 text-2xl font-bold text-teal-600">
        🧠 Learning through discovery, not instruction
      </p>
    </div>
  );
}
