"use client";

import { AnimatedVoiceInput } from "@/lib/presentation-animations";

export function HowToUse3Slide() {
  const features = [
    { icon: "⌨️", text: "Hold spacebar to speak" },
    { icon: "🎤", text: "Or tap the mic button" },
    { icon: "🔊", text: "AI can speak answers aloud" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Voice Input</h2>
      <p className="text-3xl text-gray-500 mb-16">
        Hands-free ideation — speak naturally, capture instantly
      </p>

      {/* Two column grid with fixed widths */}
      <div className="fragment fade-up grid grid-cols-2 gap-24 items-center">
        {/* Left column - Animated voice input */}
        <div className="flex justify-end">
          <AnimatedVoiceInput delay={0} />
        </div>

        {/* Right column - Instructions */}
        <div className="space-y-10">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-6">
              <span className="text-5xl">{f.icon}</span>
              <p className="text-2xl text-gray-600 font-medium">{f.text}</p>
            </div>
          ))}

          <p className="text-xl text-gray-500 pt-8 border-t border-gray-200">
            💡 Great for brainstorming and accessibility
          </p>
        </div>
      </div>
    </div>
  );
}
