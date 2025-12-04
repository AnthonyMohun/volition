"use client";

import { Check, X } from "lucide-react";

export function DifferentiatorsSlide() {
  const competitors = [
    { name: "Figjam", icon: "🎨", focus: "Collaborative whiteboard" },
    { name: "Miro", icon: "📋", focus: "Team collaboration" },
    { name: "Volition", icon: "✨", focus: "Guided ideation", highlight: true },
  ];

  const features = [
    { label: "Socratic AI Guidance", volition: true, others: false },
    { label: "Voice-First Input", volition: true, others: false },
    { label: "Local-First Privacy", volition: true, others: false },
    { label: "Design Education Focus", volition: true, others: false },
    { label: "Stuck Detection & Nudges", volition: true, others: false },
    { label: "Free-form Canvas", volition: true, others: true },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">
        What Makes Volition Different?
      </h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-16">
        Not just another whiteboard tool
      </p>

      {/* Competitor badges */}
      <div className="fragment fade-up flex gap-16 mb-16">
        {competitors.map((comp) => (
          <div key={comp.name} className="text-center">
            <span className="text-6xl block mb-4">{comp.icon}</span>
            <h3
              className={`text-3xl font-black ${
                comp.highlight ? "text-teal-600" : "text-gray-500"
              }`}
            >
              {comp.name}
            </h3>
            <p className="text-lg text-gray-400 mt-2">{comp.focus}</p>
          </div>
        ))}
      </div>

      {/* Feature comparison table */}
      <div className="fragment fade-up w-full max-w-3xl">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-8 mb-6 px-4">
          <span className="text-lg font-bold text-gray-400 text-left">
            Feature
          </span>
          <span className="text-lg font-black text-teal-600 text-center">
            Volition
          </span>
          <span className="text-lg font-bold text-gray-400 text-center">
            Others
          </span>
        </div>

        {features.map((feature) => (
          <div
            key={feature.label}
            className="grid grid-cols-[2fr_1fr_1fr] gap-8 items-center py-4 px-4 border-b border-gray-100"
          >
            <span className="text-xl text-gray-700 text-left">
              {feature.label}
            </span>
            <div className="flex justify-center">
              {feature.volition ? (
                <Check className="w-8 h-8 text-green-500" />
              ) : (
                <X className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex justify-center">
              {feature.others ? (
                <Check className="w-8 h-8 text-green-500" />
              ) : (
                <X className="w-8 h-8 text-gray-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
