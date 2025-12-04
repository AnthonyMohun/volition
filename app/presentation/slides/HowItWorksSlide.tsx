"use client";

import { Cpu, Cloud, Mic, ArrowRight } from "lucide-react";

export function HowItWorksSlide() {
  const components = [
    {
      icon: Mic,
      title: "Browser",
      desc: "Voice & text capture",
      color: "text-teal-600 bg-teal-50",
    },
    {
      icon: Cloud,
      title: "Next.js API",
      desc: "Secure routing layer",
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Cpu,
      title: "Local Services",
      desc: "Whisper STT + LM Studio",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      {/* Static title and subtitle */}
      <h2 className="text-6xl font-black text-gray-800 mb-6">How It Works</h2>
      <p className="text-4xl text-gray-500 mb-16">
        Local-first, privacy-minded architecture
      </p>

      {/* Architecture flow - animate as one */}
      <div className="fragment fade-up flex items-center justify-center gap-8 mb-16">
        {components.map((comp, index) => (
          <div key={comp.title} className="flex items-center">
            <div className="flex flex-col items-center text-center w-64">
              <div
                className={`w-24 h-24 rounded-2xl ${comp.color} flex items-center justify-center mb-5`}
              >
                <comp.icon className="w-12 h-12" />
              </div>
              <h4 className="font-bold text-2xl text-gray-800 mb-3">
                {comp.title}
              </h4>
              <p className="text-xl text-gray-500">{comp.desc}</p>
            </div>
            {index < components.length - 1 && (
              <ArrowRight className="w-10 h-10 text-gray-300 mx-6" />
            )}
          </div>
        ))}
      </div>

      {/* Key benefits - simple list */}
      <div className="fragment fade-up grid grid-cols-2 gap-x-20 gap-y-5 text-left">
        <p className="text-xl text-gray-600">✅ User data stays local</p>
        <p className="text-xl text-gray-600">✅ No third-party cloud models</p>
        <p className="text-xl text-gray-600">✅ Works offline</p>
        <p className="text-xl text-gray-600">✅ Full control over AI</p>
      </div>
    </div>
  );
}
