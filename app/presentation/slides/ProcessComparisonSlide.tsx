"use client";

import { ChevronDown, MessageSquare, Sparkles } from "lucide-react";

export function ProcessComparisonSlide() {
  const traditionalSteps = [
    "Research",
    "Define",
    "Ideate",
    "Prototype",
    "Test",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">
        Traditional vs Socratic
      </h2>
      <p className="text-4xl text-gray-500 mb-16">
        Guided exploration beats a rigid checklist
      </p>

      {/* Comparison - animate as one */}
      <div className="fragment fade-up flex gap-40 items-start">
        {/* Traditional Process */}
        <div className="text-center">
          <h3 className="text-3xl font-black text-gray-400 mb-10">
            Traditional
          </h3>
          <div className="space-y-3">
            {traditionalSteps.map((step, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="flex items-center gap-5">
                  <span className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl">
                    {i + 1}
                  </span>
                  <span className="text-xl text-gray-500 font-medium w-28 text-left">
                    {step}
                  </span>
                </div>
                {i < 4 && (
                  <ChevronDown className="w-6 h-6 text-gray-300 my-2" />
                )}
              </div>
            ))}
          </div>
          <p className="text-lg text-gray-400 mt-8">Linear steps</p>
        </div>

        {/* Socratic Process */}
        <div className="text-center">
          <h3 className="text-3xl font-black text-teal-600 mb-10">Socratic</h3>
          <div className="relative">
            {/* Central question hub */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>

            {/* Branching paths */}
            <div className="flex justify-center gap-8 mb-8">
              {["💡", "🧠", "🎯"].map((emoji, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center text-3xl shadow-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>

            {/* Discoveries */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-lg text-teal-600 mt-8">Guided exploration</p>
        </div>
      </div>

      <p className="fragment fade-up text-2xl text-gray-500 mt-14">
        💡 Questions unlock deeper thinking than instructions alone
      </p>
    </div>
  );
}
