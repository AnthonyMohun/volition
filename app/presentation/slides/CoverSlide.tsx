"use client";

export function CoverSlide() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] relative px-20">
      {/* Logo */}
      <div className="mb-10">
        <img src="/logo.png" alt="Volition" className="h-[400px] w-auto" />
      </div>

      {/* Tagline - static, not animated */}
      <p className="text-6xl font-bold text-gray-600 text-center max-w-5xl leading-tight">
        Socratic AI for clearer, faster idea development
      </p>
    </div>
  );
}
