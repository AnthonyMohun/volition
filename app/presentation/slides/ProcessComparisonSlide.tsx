"use client";

import {
  MessageSquare,
  Lightbulb,
  Brain,
  Target,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export function ProcessComparisonSlide() {
  const traditionalSteps = [
    "Research",
    "Define",
    "Ideate",
    "Prototype",
    "Test",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">
        Traditional vs Socratic
      </h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-16">
        From linear steps to guided exploration
      </p>

      <div className="flex gap-32 items-start">
        {/* Traditional Process */}
        <div className="fragment fade-right text-center">
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
                  <span className="text-xl text-gray-500 font-medium w-32 text-left">
                    {step}
                  </span>
                </div>
                {i < 4 && (
                  <ChevronDown className="w-6 h-6 text-gray-300 my-2" />
                )}
              </div>
            ))}
          </div>
          <p className="text-lg text-gray-400 mt-8">Linear progression</p>
        </div>

        {/* Socratic Process */}
        <div className="fragment fade-left text-center">
          <h3 className="text-3xl font-black text-teal-600 mb-10">Socratic</h3>

          <div className="relative py-4">
            {/* Central question hub */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center mx-auto mb-10 shadow-lg animate-pulse">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>

            {/* Branching explorations */}
            <div className="flex justify-center gap-10 mb-8">
              {[
                {
                  icon: Lightbulb,
                  label: "Insight",
                  color: "text-teal-600",
                  bg: "from-teal-100 to-green-100",
                },
                {
                  icon: Brain,
                  label: "Explore",
                  color: "text-blue-600",
                  bg: "from-blue-100 to-purple-100",
                },
                {
                  icon: Target,
                  label: "Focus",
                  color: "text-amber-600",
                  bg: "from-amber-100 to-orange-100",
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center`}
                  >
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <span className={`text-base ${item.color} mt-3 font-medium`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Deeper discoveries */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center floating-emoji"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>

          <p className="text-lg text-teal-600 mt-8">Guided exploration</p>
        </div>
      </div>

      <p className="fragment fade-in text-2xl text-gray-500 mt-14">
        💡 Questions unlock deeper thinking than instructions
      </p>
    </div>
  );
}
