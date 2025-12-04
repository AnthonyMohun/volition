"use client";

import { AnimatedVoiceInput } from "@/lib/presentation-animations";

export function HowToUse3Slide() {
  const features = [
    { icon: "⌨️", title: "Hold Spacebar", desc: "Quick voice activation" },
    { icon: "🎤", title: "Tap Mic Button", desc: "Or click to record" },
    { icon: "🔊", title: "AI Speaks Back", desc: "Hear answers aloud" },
    { icon: "💡", title: "Voice Commands", desc: "Navigate hands-free" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Voice Input</h2>
      <p className="text-3xl text-gray-500 mb-16">
        Hands-free ideation — speak naturally, capture instantly
      </p>

      {/* Two column grid - left always visible, right has individual fragments */}
      <div className="grid grid-cols-2 gap-24 items-start">
        {/* Left column - Always visible voice input preview */}
        <div className="flex justify-end">
          <AnimatedVoiceInput delay={0} />
        </div>

        {/* Right column - Each feature is its own fragment */}
        <div className="space-y-8 text-left">
          {features.map((f, index) => (
            <div
              key={f.title}
              className="fragment fade-up"
              data-fragment-index={index}
            >
              <div className="flex items-center gap-6">
                <span className="text-5xl">{f.icon}</span>
                <div>
                  <h4 className="font-bold text-2xl text-gray-800">
                    {f.title}
                  </h4>
                  <p className="text-xl text-gray-500">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
