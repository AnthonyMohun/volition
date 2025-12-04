"use client";

export function CoverSlide() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] relative">
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-[15%] left-[20%] text-5xl floating-emoji">💭</span>
        <span className="absolute top-[25%] right-[25%] text-5xl floating-emoji" style={{animationDelay: '0.5s'}}>✨</span>
        <span className="absolute bottom-[25%] left-[15%] text-5xl floating-emoji" style={{animationDelay: '1s'}}>🎨</span>
        <span className="absolute bottom-[30%] right-[20%] text-5xl floating-emoji" style={{animationDelay: '0.3s'}}>💡</span>
      </div>

      {/* Logo */}
      <div className="mb-12">
        <img src="/logo.png" alt="Volition" className="h-64 w-auto" />
      </div>

      {/* Tagline */}
      <p className="fragment fade-up text-4xl font-bold text-gray-600 mb-14">
        AI-Powered Design Thinking Through Socratic Questioning
      </p>

      {/* Subtitle */}
      <p className="fragment fade-in text-xl text-gray-400">
        NCAD Interaction Design • December 2024
      </p>
    </div>
  );
}
