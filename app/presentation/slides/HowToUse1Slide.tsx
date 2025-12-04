"use client";

import { AnimatedStickyNote } from "@/lib/presentation-animations";

export function HowToUse1Slide() {
  const features = [
    {
      emoji: "📝",
      title: "Type or Voice",
      desc: "Express ideas naturally",
    },
    { emoji: "🖼️", title: "Add Images", desc: "Reference and inspire" },
    {
      emoji: "✏️",
      title: "Sketch Ideas",
      desc: "Annotate your thoughts",
    },
    {
      emoji: "⭐",
      title: "Mark as Concept",
      desc: "Elevate winning ideas",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Sticky Notes</h2>
      <p className="text-3xl text-gray-500 mb-16">
        Capture and iterate — text, voice, images, and sketches
      </p>

      {/* Two column grid - left always visible, right has individual fragments */}
      <div className="grid grid-cols-2 gap-24 items-start">
        {/* Left column - Always visible preview */}
        <div className="flex justify-end">
          <AnimatedStickyNote delay={0} />
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
                <span className="text-5xl">{f.emoji}</span>
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
