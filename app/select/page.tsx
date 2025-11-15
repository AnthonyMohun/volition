"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import {
  ArrowLeft,
  RotateCcw,
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

  const getDarkenedColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#fef3c7": "#3a3420",
      "#fecaca": "#3a2020",
      "#bbf7d0": "#1e3a28",
      "#bfdbfe": "#1e2a3a",
      "#e9d5ff": "#2d1e3a",
      "#fbcfe8": "#3a1e30",
    };
    return colorMap[color] || color;
  };

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null;
  }

  return (
    <div className="min-h-screen dark-gradient-radial texture-overlay flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-800 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/canvas")}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
            title="Back to canvas"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            onClick={handleStartNewProject}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
            title="Start a new project"
          >
            <RotateCcw className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">
              Select Your Top Concepts
            </h1>
            <p className="text-sm text-gray-400">
              Choose 3 concepts to refine and evaluate
            </p>
          </div>
        </div>
        <button
          onClick={handleProceedToRefine}
          disabled={selectedConcepts.length !== 3}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium silver-glow whitespace-nowrap"
        >
          Continue to Refine
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* HMW Statement Display */}
          <div className="glass rounded-xl p-5 mb-6 border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-300 mb-1">
                  Your Challenge
                </h3>
                <p className="text-base text-gray-100 font-medium">
                  {state.hmwStatement}
                </p>
              </div>
            </div>
          </div>

          {/* Selection Section */}
          <div className="glass rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  Select 3 Concepts to Review
                </h2>
                <p className="text-sm text-gray-400">
                  Click cards to select your strongest ideas. You'll refine each
                  one in the next step.
                  {conceptNotes.some((n) => n.image) && (
                    <span className="block mt-1 text-purple-400">
                      ✓ Sketches/images will be included in AI evaluation
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end">
                <div
                  aria-live="polite"
                  className="text-sm text-gray-300 font-medium"
                >
                  Selected {selectedConcepts.length}/3
                </div>
                {selectedConcepts.length === 3 && (
                  <CheckCircle2 className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left h-full ${
                        isSelected
                          ? "border-purple-500 glass shadow-lg shadow-purple-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? undefined
                          : getDarkenedColor(note.color),
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Star
                          className={`w-5 h-5 flex-shrink-0 ${
                            isSelected
                              ? "text-purple-400 fill-current"
                              : "text-yellow-400"
                          }`}
                        />
                        {isSelected && (
                          <span className="text-xs font-semibold text-purple-300 glass-light px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      {note.image && (
                        <img
                          src={note.image.dataUrl}
                          alt={note.image.caption || "Concept"}
                          className="w-full h-24 object-cover rounded mb-2 border border-gray-700/50"
                        />
                      )}
                      <p className="text-sm text-gray-200 line-clamp-2 mb-2 font-medium">
                        {note.text}
                      </p>

                      {note.details && note.details.trim() && (
                        <p className="text-xs text-gray-400 italic line-clamp-2 border-t border-gray-700/30 pt-2">
                          {note.details}
                        </p>
                      )}
                      {(!note.details || !note.details.trim()) && (
                        <p className="text-xs text-orange-400/70 italic border-t border-gray-700/30 pt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No description
                        </p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 glass rounded-lg p-4 border border-blue-500/20 bg-blue-500/5">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Don't worry about picking perfect
              concepts now—you'll have a chance to develop and refine them in
              the next step. Focus on picking ideas with the most potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
