"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "@/components/hmw-helper-modal";
import { CrazyEightsModal } from "@/components/crazy-eights-modal";
import { EXAMPLE_SESSION_DATA } from "@/lib/example-data";
import { PlayCircle, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { updateHMW, setPhase, loadExampleSession } = useSession();
  const [hmwInput, setHmwInput] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [showCrazyEights, setShowCrazyEights] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hmwInput.trim()) {
      updateHMW(hmwInput.trim());
      setPhase("canvas");
      router.push("/canvas");
    }
  };

  const handleSelectTemplate = (template: string) => {
    setHmwInput(template);
    setShowHelper(false);
  };

  const handleTryExample = () => {
    loadExampleSession(EXAMPLE_SESSION_DATA);
    router.push("/canvas");
  };

  return (
    <div className="min-h-screen fun-gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl opacity-20 float-animation">
          ✨
        </div>
        <div
          className="absolute top-40 right-20 text-5xl opacity-20 float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-5xl opacity-20 float-animation"
          style={{ animationDelay: "2s" }}
        >
          🎨
        </div>
        <div
          className="absolute bottom-20 right-1/3 text-6xl opacity-20 float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🚀
        </div>
        <div
          className="absolute top-1/3 right-10 text-5xl opacity-20 float-animation"
          style={{ animationDelay: "1.5s" }}
        >
          💫
        </div>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-black fun-gradient-text tracking-tight mb-4">
            Volition
          </h1>
          <p className="text-gray-700 text-2xl font-bold mb-2">
            Discover concepts through guided exploration
          </p>
          <p className="text-gray-500 text-base font-medium">
            Your AI-powered creative companion for design thinking 🎯
          </p>
        </div>

        {/* Main Card */}
        <div className="fun-card p-8 mb-8 relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="hmw"
                  className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2"
                >
                  <span className="text-lg">💭</span>
                  Your Design Challenge
                </label>
                <button
                  type="button"
                  onClick={handleTryExample}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all shadow-sm hover:shadow-blue transform hover:scale-105"
                  title="Load a complete example session"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Try Example</span>
                </button>
              </div>
              <div className="relative">
                <textarea
                  id="hmw"
                  value={hmwInput}
                  onChange={(e) => setHmwInput(e.target.value)}
                  placeholder="✏️ Frame your challenge as a 'How Might We' statement to begin..."
                  className="w-full px-6 py-5 pr-16 bg-gradient-to-br from-white to-gray-50/50 border-3 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none text-gray-800 placeholder:text-gray-400 transition-all text-lg font-semibold shadow-sm hover:shadow-md"
                  rows={3}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowHelper(true)}
                  className="absolute bottom-4 right-4 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                  title="Open HMW Builder"
                  aria-label="Open HMW Builder"
                >
                  🛠️ HMW Builder
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                aria-label="Learn how it works"
                title="Learn how 'How Might We' statements work"
                className="fun-button-secondary flex items-center justify-center gap-2 bounce-hover"
              >
                <span className="text-xl">💡</span>
                <span className="font-black">How it works</span>
              </button>

              <button
                type="submit"
                disabled={!hmwInput.trim()}
                className="fun-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-black">Begin Exploration</span>
                <span className="text-xl">🚀</span>
              </button>
            </div>
          </form>
        </div>

        {/* Crazy Eights Sprint */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowCrazyEights(true)}
            className="inline-flex items-center gap-2 text-sm font-black text-gray-600 hover:text-blue-600 transition-all bg-white/60 backdrop-blur-sm px-5 py-3 rounded-full shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            Crazy Eights Sprint ⚡
          </button>
        </div>
      </div>

      <HMWHelperModal
        isOpen={showHelper}
        onClose={() => setShowHelper(false)}
        onSelect={handleSelectTemplate}
      />

      <CrazyEightsModal
        isOpen={showCrazyEights}
        onClose={() => setShowCrazyEights(false)}
      />
    </div>
  );
}
