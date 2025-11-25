"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import {
  ArrowLeft,
  ListRestart,
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

export default function SelectPage() {
  const router = useRouter();
  const {
    state,
    setPhase,
    setSelectedConcepts: saveSelectedConcepts,
  } = useSession();
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  const conceptNotes = state.notes.filter((n) => n.isConcept);

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 3) {
      router.push("/canvas");
    }
  }, [state.hmwStatement, conceptNotes.length, router]);

  const toggleConceptSelection = (noteId: string) => {
    setSelectedConcepts((prev) => {
      const newSelection = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : prev.length < 3
        ? [...prev, noteId]
        : prev;

      return newSelection;
    });
  };

  const handleProceedToRefine = () => {
    if (selectedConcepts.length === 3) {
      saveSelectedConcepts(selectedConcepts, {});
      setPhase("select");
      router.push("/refine");
    }
  };

  const handleStartNewProject = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      router.push("/");
    }
  };

  const getFunColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#fef3c7": "#fef3c7", // yellow
      "#fecaca": "#fecaca", // red
      "#bbf7d0": "#bbf7d0", // green
      "#bfdbfe": "#bfdbfe", // blue
      "#e9d5ff": "#e9d5ff", // purple
      "#fbcfe8": "#fbcfe8", // pink
    };
    return colorMap[color] || "#ffffff";
  };

  const getAccentColor = (color: string) => {
    const accentMap: Record<string, string> = {
      "#fef3c7": "#fbbf24", // yellow
      "#fecaca": "#f87171", // red
      "#bbf7d0": "#34d399", // green
      "#bfdbfe": "#60a5fa", // blue
      "#e9d5ff": "#a78bfa", // purple
      "#fbcfe8": "#f472b6", // pink
    };
    return accentMap[color] || "#e5e7eb";
  };

  const getShadowColor = (color: string) => {
    const shadowMap: Record<string, string> = {
      "#fef3c7": "rgba(251, 191, 36, 0.4)",
      "#fecaca": "rgba(248, 113, 113, 0.4)",
      "#bbf7d0": "rgba(52, 211, 153, 0.4)",
      "#bfdbfe": "rgba(96, 165, 250, 0.4)",
      "#e9d5ff": "rgba(167, 139, 250, 0.4)",
      "#fbcfe8": "rgba(244, 114, 182, 0.4)",
    };
    return shadowMap[color] || "rgba(163, 177, 198, 0.3)";
  };

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null;
  }

  return (
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 text-6xl float-animation">
          ⭐
        </div>
        <div
          className="absolute top-40 right-20 text-5xl float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-5xl float-animation"
          style={{ animationDelay: "2s" }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-20 right-1/3 text-6xl float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🎯
        </div>
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white to-purple-50/50 border-b-3 border-purple-200 px-6 py-5 flex items-center justify-between shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/canvas")}
            className="p-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
            title="Back to canvas"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
          <button
            onClick={handleStartNewProject}
            className="p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
            title="Start a new project"
          >
            <ListRestart className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Select Your Top Concepts
            </h1>
            <p className="text-sm text-gray-600 font-bold">
              Choose 3 concepts to refine and evaluate ✨
            </p>
          </div>
        </div>
        <button
          onClick={handleProceedToRefine}
          disabled={selectedConcepts.length !== 3}
          className="fun-button-primary flex items-center gap-2 font-black disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 shadow-lg hover:shadow-purple whitespace-nowrap"
        >
          Continue to Refine
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* HMW Statement Display */}
          <div className="fun-card p-6 mb-8 border-3 border-purple-300 bg-gradient-to-br from-white to-purple-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-2xl"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-2xl shadow-md">
                <Lightbulb className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-purple-600 mb-2 uppercase tracking-wide">
                  💭 Design Challenge
                </h3>
                <p className="text-lg text-gray-800 font-bold leading-relaxed">
                  {state.hmwStatement}
                </p>
              </div>
            </div>
          </div>

          {/* Selection Section */}
          <div className="fun-card p-8 border-3 border-gray-200 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full blur-2xl"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-black text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-3xl">⭐</span>
                  Select 3 Concepts to Review
                </h2>
                <p className="text-sm text-gray-600 font-semibold leading-relaxed">
                  Click cards to select your strongest ideas. You'll refine each
                  one in the next step.
                  {conceptNotes.some((n) => n.image) && (
                    <span className="block mt-2 text-purple-600 flex items-center gap-1">
                      <span className="text-lg">✓</span> Sketches/images will be
                      included in AI evaluation
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-6 flex flex-col items-end">
                <div
                  aria-live="polite"
                  className="text-base text-gray-700 font-black mb-2"
                >
                  Selected {selectedConcepts.length}/3
                </div>
                {selectedConcepts.length === 3 && (
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-2xl shadow-md animate-bounce">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {conceptNotes.map((note) => {
                const isSelected = selectedConcepts.includes(note.id);
                const selectionDisabled =
                  !isSelected && selectedConcepts.length >= 3;

                return (
                  <div key={note.id}>
                    <button
                      onClick={() => toggleConceptSelection(note.id)}
                      disabled={selectionDisabled}
                      title={
                        selectionDisabled
                          ? "You can only select up to 3 concepts"
                          : undefined
                      }
                      aria-pressed={isSelected}
                      className={`w-full p-5 rounded-3xl border-3 transition-all text-left h-full relative overflow-hidden ${
                        isSelected
                          ? "scale-105 ring-4 ring-purple-300 ring-offset-2"
                          : "hover:scale-102 hover:-translate-y-1"
                      } ${
                        selectionDisabled && !isSelected
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }`}
                      style={{
                        backgroundColor: getFunColor(note.color),
                        borderColor: isSelected
                          ? "#a78bfa"
                          : getAccentColor(note.color),
                        boxShadow: isSelected
                          ? `12px 12px 24px rgba(167, 139, 250, 0.5), -4px -4px 12px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(167, 139, 250, 0.3)`
                          : `8px 8px 16px ${getShadowColor(
                              note.color
                            )}, -2px -2px 8px rgba(255, 255, 255, 0.6), inset 1px 1px 2px rgba(255, 255, 255, 0.3)`,
                      }}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-2 shadow-lg animate-pulse z-10">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <Star
                          className={`w-6 h-6 flex-shrink-0 ${
                            isSelected
                              ? "text-purple-500 fill-current drop-shadow-md"
                              : "text-yellow-500 fill-current drop-shadow-sm"
                          }`}
                        />
                        {isSelected && (
                          <span className="text-xs font-black text-purple-600 bg-purple-100/80 px-3 py-1 rounded-full shadow-sm">
                            Selected ✓
                          </span>
                        )}
                      </div>
                      {note.image && (
                        <img
                          src={note.image.dataUrl}
                          alt={note.image.caption || "Concept"}
                          className="w-full h-28 object-cover rounded-2xl mb-3 border-3 border-white shadow-md"
                        />
                      )}
                      <p className="text-sm text-gray-800 line-clamp-3 mb-3 font-bold leading-relaxed">
                        {note.text}
                      </p>

                      {note.details && note.details.trim() && (
                        <p className="text-xs text-gray-600 italic line-clamp-2 border-t-2 border-gray-300/50 pt-3 font-semibold">
                          {note.details}
                        </p>
                      )}
                      {(!note.details || !note.details.trim()) && (
                        <p className="text-xs text-orange-500 italic border-t-2 border-gray-300/50 pt-3 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> No description
                          added
                        </p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 fun-card p-5 border-3 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/40 to-transparent rounded-full blur-xl"></div>
            <p className="text-sm text-blue-800 font-bold leading-relaxed relative z-10 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <span>
                <strong className="font-black">Tip:</strong> Don't worry about
                picking perfect concepts now—you'll have a chance to develop and
                refine them in the next step. Focus on picking ideas with the
                most potential!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
