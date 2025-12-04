"use client";

import { AnimatedSuccessJourney } from "@/lib/presentation-animations";
import { TrendingUp } from "lucide-react";

export function SuccessSlide() {
  const outcomes = [
    {
      icon: "🎯",
      title: "Clear Challenges",
      desc: "Well-defined HMW statements",
    },
    {
      icon: "💡",
      title: "Rich Ideation",
      desc: "Deep exploration of possibilities",
    },
    {
      icon: "⭐",
      title: "Strong Concepts",
      desc: "Validated and refined ideas",
    },
    { icon: "📝", title: "Documentation", desc: "Exportable design artifacts" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">
        What Success Looks Like
      </h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-14">
        Students confidently developing and evaluating concepts
      </p>

      {/* Journey visualization */}
      <div className="fragment fade-up mb-16">
        <AnimatedSuccessJourney delay={0} />
      </div>

      {/* Outcome items */}
      <div className="flex gap-20 mb-14">
        {outcomes.map((outcome, index) => (
          <div
            key={outcome.title}
            className="fragment fade-up text-center"
            data-fragment-index={index + 2}
          >
            <span className="text-6xl block mb-5">{outcome.icon}</span>
            <h4 className="font-bold text-gray-800 text-2xl mb-2">
              {outcome.title}
            </h4>
            <p className="text-lg text-gray-500">{outcome.desc}</p>
          </div>
        ))}
      </div>

      {/* Success metric */}
      <div className="fragment fade-in flex items-center gap-5 text-green-600">
        <TrendingUp className="w-10 h-10" />
        <p className="text-2xl font-bold">
          From uncertainty to confident concept development
        </p>
      </div>
    </div>
  );
}
