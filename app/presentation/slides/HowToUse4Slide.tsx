"use client";

export function HowToUse4Slide() {
  const stages = [
    { emoji: "💭", title: "Define", desc: "Frame your HMW challenge" },
    { emoji: "🎨", title: "Ideate", desc: "Create and explore ideas" },
    { emoji: "⭐", title: "Select", desc: "Pick your best concepts" },
    { emoji: "✨", title: "Refine", desc: "Add details and depth" },
    { emoji: "🚀", title: "Export", desc: "Share your work" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">The Journey</h2>
      <p className="text-4xl text-gray-500 mb-16">
        From challenge to polished concepts in 5 stages
      </p>

      {/* Stage cards - animate as one group */}
      <div className="fragment fade-up flex gap-12">
        {stages.map((stage, index) => (
          <div key={stage.title} className="text-center w-44">
            <div className="w-24 h-24 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-md">
              <span className="text-5xl">{stage.emoji}</span>
            </div>
            <h4 className="font-bold text-gray-800 text-2xl mb-3">
              {stage.title}
            </h4>
            <p className="text-lg text-gray-500">{stage.desc}</p>
          </div>
        ))}
      </div>

      <p className="fragment fade-up text-2xl text-gray-500 mt-14">
        ✅ Guided progression keeps students on track
      </p>
    </div>
  );
}
