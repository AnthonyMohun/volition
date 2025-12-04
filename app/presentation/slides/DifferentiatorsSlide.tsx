"use client";

import { Check, X } from "lucide-react";

export function DifferentiatorsSlide() {
  const features = [
    { label: "Socratic AI Guidance", volition: true, others: false },
    { label: "Voice-First Input", volition: true, others: false },
    { label: "Local-First Privacy", volition: true, others: false },
    { label: "Design Education Focus", volition: true, others: false },
    { label: "Free-form Canvas", volition: true, others: true },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Why Volition?</h2>
      <p className="text-4xl text-gray-500 mb-16">
        Purpose-built for learning and discovery
      </p>

      {/* Competitor comparison */}
      <div className="fragment fade-up flex gap-24 mb-14">
        {[
          { name: "Figjam", icon: "🎨", highlight: false },
          { name: "Miro", icon: "📋", highlight: false },
          { name: "Volition", icon: "✨", highlight: true },
        ].map((comp) => (
          <div key={comp.name} className="text-center">
            <span className="text-6xl block mb-4">{comp.icon}</span>
            <h3
              className={`text-3xl font-black ${
                comp.highlight ? "text-teal-600" : "text-gray-400"
              }`}
            >
              {comp.name}
            </h3>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="fragment fade-up w-full max-w-3xl">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-8 mb-5 px-6">
          <span className="text-xl font-bold text-gray-400 text-left">
            Feature
          </span>
          <span className="text-xl font-black text-teal-600 text-center">
            Volition
          </span>
          <span className="text-xl font-bold text-gray-400 text-center">
            Others
          </span>
        </div>

        {features.map((feature) => (
          <div
            key={feature.label}
            className="grid grid-cols-[2fr_1fr_1fr] gap-8 items-center py-4 px-6 border-b border-gray-100"
          >
            <span className="text-xl text-gray-700 text-left">
              {feature.label}
            </span>
            <div className="flex justify-center">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <div className="flex justify-center">
              {feature.others ? (
                <Check className="w-7 h-7 text-green-500" />
              ) : (
                <X className="w-7 h-7 text-gray-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
