"use client";

import { AnimatedVoiceInput } from "@/lib/presentation-animations";

export function HowToUse3Slide() {
  const features = [
    { icon: "⌨️", text: "Hold spacebar to speak (push-to-talk)" },
    { icon: "🎤", text: "Or hold the mic button in toolbar" },
    { icon: "🔊", text: "AI can speak responses aloud" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">Voice Input</h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-20">
        Hands-free ideation with natural speech
      </p>

      <div className="flex items-center gap-24">
        {/* Animated voice input */}
        <div className="fragment fade-right">
          <AnimatedVoiceInput delay={0} />
        </div>

        {/* Instructions */}
        <div className="space-y-10">
          {features.map((f, i) => (
            <div
              key={f.text}
              className="fragment fade-left flex items-center gap-6"
              data-fragment-index={i + 1}
            >
              <span className="text-5xl">{f.icon}</span>
              <p className="text-2xl text-gray-600 font-medium">{f.text}</p>
            </div>
          ))}

          <p className="fragment fade-in text-xl text-gray-500 pt-8 border-t border-gray-200">
            💡 Great for brainstorming sessions and accessibility
          </p>
        </div>
      </div>
    </div>
  );
}
