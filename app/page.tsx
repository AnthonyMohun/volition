"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "@/components/hmw-helper-modal";
import { CrazyEightsModal } from "@/components/crazy-eights-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { EXAMPLE_SESSION_DATA } from "@/lib/example-data";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { updateHMW, setPhase, loadExampleSession, resetSession } =
    useSession();
  const [hmwInput, setHmwInput] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [showCrazyEights, setShowCrazyEights] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hmwInput.trim()) {
      // Clear any previous session before starting a new one
      resetSession();
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
    <div className="min-h-screen fun-gradient-bg flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-5xl md:text-6xl opacity-20 float-animation">
          ✨
        </div>
        <div
          className="absolute top-40 right-20 text-4xl md:text-5xl opacity-20 float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-4xl md:text-5xl opacity-20 float-animation"
          style={{ animationDelay: "2s" }}
        >
          🎨
        </div>
        <div
          className="absolute bottom-20 right-1/3 text-5xl md:text-6xl opacity-20 float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🚀
        </div>
        <div
          className="absolute top-1/3 right-10 text-4xl md:text-5xl opacity-20 float-animation"
          style={{ animationDelay: "1.5s" }}
        >
          💫
        </div>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <img
            src="/logo.png"
            alt="Volition"
            className="h-24 md:h-32 mx-auto mb-3 md:mb-4"
          />
          <p className="text-gray-700 text-lg md:text-2xl font-bold px-4 max-w-md mx-auto">
            Transform design challenges into clear, actionable concepts
          </p>
        </div>

        {/* Main Card */}
        <div className="fun-card p-5 md:p-8 mb-6 md:mb-8 relative overflow-hidden mx-2 md:mx-0">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="mb-5 md:mb-6">
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="hmw"
                  className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2"
                >
                  <span className="text-base md:text-lg">💭</span>
                  Your Design Challenge
                </label>
                {/* Quick Actions Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-1.5 px-3 py-2.5 md:py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-all touch-manipulation"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Quick Start</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        showMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOnboarding(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 md:py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors touch-manipulation"
                      >
                        <span>💡</span> How it works
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleTryExample();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 md:py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors touch-manipulation"
                      >
                        <span>▶️</span> Try Example
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowHelper(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 md:py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors touch-manipulation"
                      >
                        <span>🛠️</span> HMW Builder
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                id="hmw"
                value={hmwInput}
                onChange={(e) => setHmwInput(e.target.value)}
                placeholder="✏️ Frame your challenge as a 'How Might We' statement to begin..."
                className="w-full px-4 md:px-6 py-4 md:py-5 bg-gradient-to-br from-white to-gray-50/50 border-3 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none text-gray-800 placeholder:text-gray-400 transition-all text-base md:text-lg font-semibold shadow-sm hover:shadow-md touch-manipulation"
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowCrazyEights(true)}
                className="fun-button-secondary flex items-center justify-center gap-2 py-3 md:py-2.5 touch-manipulation"
              >
                <span className="text-lg">⚡</span>
                <span className="font-black">Crazy Eights</span>
              </button>
              <button
                type="submit"
                disabled={!hmwInput.trim()}
                className="fun-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-8 md:px-12 py-3 md:py-2.5 touch-manipulation"
              >
                <span className="font-black">Begin Exploration</span>
                <span className="text-xl">🚀</span>
              </button>
            </div>
          </form>
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

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
