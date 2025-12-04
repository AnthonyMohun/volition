"use client";

import { TrendingUp } from "lucide-react";

export function SuccessSlide() {
  const outcomes = [
    {
      icon: "🎯",
      title: "Clear Challenges",
      desc: "Well-defined HMW statements",
    },
    { icon: "💡", title: "Rich Ideation", desc: "Deep exploration of ideas" },
    { icon: "⭐", title: "Strong Concepts", desc: "Validated and refined" },
    { icon: "📝", title: "Documentation", desc: "Exportable artifacts" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">
        Better Ideas, Faster
      </h2>
      <p className="text-4xl text-gray-500 mb-16">
        Students craft stronger concepts with less friction
      </p>

      {/* Outcome items - animate as one group */}
      <div className="fragment fade-up flex gap-20 mb-14">
        {outcomes.map((outcome) => (
          <div key={outcome.title} className="text-center w-56">
            <span className="text-6xl block mb-5">{outcome.icon}</span>
            <h4 className="font-bold text-gray-800 text-2xl mb-3">
              {outcome.title}
            </h4>
            <p className="text-lg text-gray-500">{outcome.desc}</p>
          </div>
        ))}
      </div>

      {/* Success metric */}
      <div className="fragment fade-up flex items-center gap-5 text-green-600">
        <TrendingUp className="w-10 h-10" />
        <p className="text-2xl font-bold">
          From uncertainty to confident concept development
        </p>
      </div>
    </div>
  );
}
