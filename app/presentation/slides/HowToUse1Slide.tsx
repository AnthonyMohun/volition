"use client";

import { AnimatedStickyNote } from "@/lib/presentation-animations";

export function HowToUse1Slide() {
  const features = [
    { emoji: "📝", title: "Type or Voice", desc: "Express ideas your way" },
    { emoji: "🖼️", title: "Add Images", desc: "Reference and inspiration" },
    { emoji: "✏️", title: "Sketch Ideas", desc: "Draw directly on notes" },
    { emoji: "⭐", title: "Mark as Concept", desc: "Elevate your best ideas" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-16">
      <h2 className="text-6xl font-black text-gray-800 mb-6">Sticky Notes</h2>

      <p className="fragment fade-in text-3xl text-gray-500 mb-20">
        Capture ideas with rich, interactive notes
      </p>

      <div className="flex items-center gap-24">
        {/* Animated sticky note */}
        <div className="fragment fade-right">
          <AnimatedStickyNote delay={0} />
        </div>

        {/* Features list */}
        <div className="space-y-10">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="fragment fade-left flex items-center gap-6"
              data-fragment-index={i + 1}
            >
              <span className="text-5xl">{f.emoji}</span>
              <div>
                <h4 className="font-bold text-2xl text-gray-800">{f.title}</h4>
                <p className="text-xl text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
