"use client";

export function WhoForSlide() {
  const personas = [
    {
      emoji: "🎓",
      title: "Design Students",
      description: "Learning to develop and evaluate concepts",
    },
    {
      emoji: "👩‍🏫",
      title: "Educators",
      description: "Teaching design thinking with AI scaffolding",
    },
    {
      emoji: "🎨",
      title: "Early-Career Designers",
      description: "Building confidence through structured questioning",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">Who is it for?</h2>
      <p className="text-4xl text-gray-500 mb-16">
        Built for{" "}
        <span className="font-black text-teal-600">design education</span> —
        classroom and studio-ready
      </p>

      {/* Persona cards - animate together */}
      <div className="fragment fade-up flex gap-20 mb-16">
        {personas.map((persona) => (
          <div key={persona.title} className="text-center w-80">
            <span className="text-8xl block mb-8">{persona.emoji}</span>
            <h3 className="text-3xl font-black text-gray-800 mb-4">
              {persona.title}
            </h3>
            <p className="text-xl text-gray-500 font-medium">
              {persona.description}
            </p>
          </div>
        ))}
      </div>

      {/* Context badges */}
      <div className="fragment fade-up flex gap-12">
        {["🏫 Classroom-ready", "🔒 Privacy-first", "💻 Works locally"].map(
          (badge) => (
            <span key={badge} className="text-2xl font-bold text-gray-500">
              {badge}
            </span>
          )
        )}
      </div>
    </div>
  );
}
