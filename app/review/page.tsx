"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  CheckCheck,
  Edit3,
  X,
  Save,
} from "lucide-react";

interface ConceptQuality {
  noteId: string;
  clarity: number; // 1-3
  feasibility: number; // 1-3
  novelty: number; // 1-3
  relevance: number; // 1-3
  overallScore: number;
}

interface ConceptEditForm {
  title: string;
  problem: string;
  solution: string;
  userValue: string;
  implementation: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const {
    state,
    setPhase,
    resetSession,
    updateNote,
    setSelectedConcepts: saveSelectedConcepts,
  } = useSession();
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ConceptEditForm>({
    title: "",
    problem: "",
    solution: "",
    userValue: "",
    implementation: "",
  });
  const [wizardComplete, setWizardComplete] = useState(false);
  const [guidedIndex, setGuidedIndex] = useState(0);

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

      // Auto-start wizard when 3 concepts selected
      if (newSelection.length === 3 && !wizardComplete) {
        setTimeout(() => {
          const firstNote = conceptNotes.find((n) => n.id === newSelection[0]);
          if (firstNote) {
            startEditingConcept(firstNote);
          }
        }, 100);
      }

      return newSelection;
    });
  };

  const assessConceptQuality = (
    note: (typeof conceptNotes)[0]
  ): ConceptQuality => {
    let clarity = 1;
    let feasibility = 1;
    let novelty = 1;
    let relevance = 1;

    // Clarity: Do we have enough detail?
    if (note.text.length > 50) clarity = 2;
    if (note.details && note.details.length > 100) clarity = 3;

    // Feasibility: Is it realistic?
    const unrealisticWords = [
      "magic",
      "impossible",
      "super power",
      "teleport",
      "mind read",
    ];
    const hasUnrealistic = unrealisticWords.some((w) =>
      note.text.toLowerCase().includes(w)
    );
    if (!hasUnrealistic) feasibility = 2;
    if (note.details && !hasUnrealistic) feasibility = 3;

    // Novelty: Is it unique?
    const genericWords = ["app", "website", "better", "faster", "improved"];
    const veryGeneric = genericWords.filter((w) =>
      note.text.toLowerCase().includes(w)
    ).length;
    if (veryGeneric < 2) novelty = 2;
    if (veryGeneric === 0 && note.details) novelty = 3;

    // Relevance: Does it address the HMW?
    const hmwKeywords = state.hmwStatement
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 4);
    const matched = hmwKeywords.filter((kw) =>
      (note.text + (note.details || "")).toLowerCase().includes(kw)
    ).length;
    if (matched > 0) relevance = 2;
    if (matched > 2 || (note.details && matched > 0)) relevance = 3;

    const overallScore = Math.round(
      (((clarity + feasibility + novelty + relevance) / 4) * 100) / 3
    );

    return {
      noteId: note.id,
      clarity,
      feasibility,
      novelty,
      relevance,
      overallScore,
    };
  };

  const selectedNotes = selectedConcepts
    .map((id) => conceptNotes.find((n) => n.id === id))
    .filter((n) => n !== undefined) as typeof conceptNotes;

  const avgQuality =
    selectedNotes.length > 0
      ? Math.round(
          selectedNotes.reduce((sum, note) => {
            const q = assessConceptQuality(note);
            return sum + q.overallScore;
          }, 0) / selectedNotes.length
        )
      : 0;

  const handleProceedToFinal = () => {
    if (selectedConcepts.length === 3) {
      const warnings: string[] = [];
      selectedConcepts.forEach((id) => {
        const note = conceptNotes.find((n) => n.id === id);
        if (!note) return;

        const quality = assessConceptQuality(note);

        const defaultTexts = ["new note", "new note..", "concept", "idea", ""];
        const isPlaceholder = defaultTexts.some(
          (t) => note.text.toLowerCase().trim() === t
        );
        const isTooShort = note.text.trim().length < 10;
        const hasNoDetails = !note.details || note.details.trim().length < 20;

        if (isPlaceholder) {
          warnings.push(`"${note.text}" is just placeholder text`);
        } else if (isTooShort) {
          warnings.push(`"${note.text}" lacks clarity and detail`);
        } else if (hasNoDetails) {
          warnings.push(`"${note.text}" has no supporting details`);
        } else if (quality.overallScore < 50) {
          warnings.push(
            `"${note.text}" may be too generic - consider what makes it unique`
          );
        }
      });

      if (warnings.length > 0) {
        const message =
          `⚠️ Quality Concerns:\n\n${warnings.join("\n")}\n\n` +
          `These concepts may score lower on novelty and clarity. ` +
          `Go back to the canvas to refine them? Proceed with evaluation anyway?`;

        const proceed = confirm(message);
        if (!proceed) return;
      }

      saveSelectedConcepts(selectedConcepts, {});
      setPhase("final");
      router.push("/final");
    }
  };

  const handleStartNewProject = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      resetSession();
      router.push("/");
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getQualityLabel = (score: number) => {
    if (score >= 75) return "Strong";
    if (score >= 50) return "Developing";
    return "Needs Work";
  };

  const startEditingConcept = (note: (typeof conceptNotes)[0]) => {
    setEditingId(note.id);

    // Try to parse existing details if structured
    if (note.details && note.details.includes("Problem:")) {
      const parts = note.details.split("\n\n");
      const parsed: ConceptEditForm = {
        title: note.text,
        problem: "",
        solution: "",
        userValue: "",
        implementation: "",
      };

      parts.forEach((part) => {
        if (part.startsWith("Problem:"))
          parsed.problem = part.replace("Problem: ", "").trim();
        if (part.startsWith("Solution:"))
          parsed.solution = part.replace("Solution: ", "").trim();
        if (part.startsWith("User Value:"))
          parsed.userValue = part.replace("User Value: ", "").trim();
        if (part.startsWith("Implementation:"))
          parsed.implementation = part.replace("Implementation: ", "").trim();
      });

      setEditForm(parsed);
    } else {
      setEditForm({
        title: note.text,
        problem: "",
        solution: note.details || "",
        userValue: "",
        implementation: "",
      });
    }
  };

  const saveConcept = () => {
    if (!editingId) return;

    const detailsText = [
      editForm.problem && `Problem: ${editForm.problem}`,
      editForm.solution && `Solution: ${editForm.solution}`,
      editForm.userValue && `User Value: ${editForm.userValue}`,
      editForm.implementation && `Implementation: ${editForm.implementation}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    updateNote(editingId, {
      text: editForm.title,
      details: detailsText,
    });

    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setGuidedIndex(0);
  };

  const skipConcept = () => {
    // Skip without saving and move to next concept
    nextGuidedConcept();
  };

  const nextGuidedConcept = () => {
    if (guidedIndex < selectedNotes.length - 1) {
      setGuidedIndex(guidedIndex + 1);
      const nextNote = selectedNotes[guidedIndex + 1];
      if (nextNote) {
        startEditingConcept(nextNote);
      }
    } else {
      setWizardComplete(true);
      setEditingId(null);
      setGuidedIndex(0);
    }
  };

  const saveConceptGuided = () => {
    saveConcept();
    nextGuidedConcept();
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
              Refine & Review Concepts
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl truncate">
              Assess your concepts before AI evaluation
            </p>
          </div>
        </div>
        <button
          onClick={handleProceedToFinal}
          disabled={selectedConcepts.length !== 3}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium silver-glow whitespace-nowrap"
        >
          Get AI Evaluation
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

          {/* Selection Step */}
          <div className="glass rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  Select 3 Concepts to Review
                </h2>
                <p className="text-sm text-gray-400">
                  Click cards to select. Each concept will be assessed on
                  clarity, feasibility, novelty, and relevance to your HMW.
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
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {conceptNotes.map((note) => {
                const isSelected = selectedConcepts.includes(note.id);
                const quality = assessConceptQuality(note);
                const selectionDisabled =
                  !isSelected && selectedConcepts.length >= 3;
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

          {/* Wizard or Summary View */}
          {selectedConcepts.length === 3 && wizardComplete && !editingId && (
            <div className="glass rounded-xl p-6 border border-gray-700/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-gray-100">
                  Your Refined Concepts
                </h3>
                <p className="text-sm text-gray-400 ml-auto">
                  Click Edit to make changes
                </p>
              </div>

              <div className="space-y-3">
                {selectedNotes.map((note) => {
                  const quality = assessConceptQuality(note);

                  // Parse problem from details
                  let problemText = "";
                  if (note.details?.includes("Problem:")) {
                    const match = note.details.match(/Problem:\s*([^\n]+)/);
                    if (match) problemText = match[1];
                  }

                  return (
                    <div
                      key={note.id}
                      className="glass-light rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-100 mb-1">
                            {note.text}
                          </h4>
                          {problemText && (
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {problemText}
                            </p>
                          )}
                          {quality.overallScore >= 75 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-xs text-green-400">
                                Strong concept
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startEditingConcept(note)}
                          className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group flex-shrink-0"
                        >
                          <Edit3 className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard / Edit Mode */}
          {selectedConcepts.length === 3 && editingId && (
            <div className="glass rounded-xl p-6 border border-gray-700/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-100">
                  {!wizardComplete
                    ? `Refine Concept ${guidedIndex + 1} of ${
                        selectedNotes.length
                      }`
                    : "Edit Concept"}
                </h3>
              </div>

              {!wizardComplete && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    💡 Let's refine this concept together. Fill in what you can
                    - you can always come back to this later.
                  </p>
                  <div className="flex gap-2 mt-3">
                    {selectedNotes.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          idx < guidedIndex
                            ? "bg-green-500"
                            : idx === guidedIndex
                            ? "bg-blue-500"
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selectedNotes.map((note, idx) => {
                  const isEditing = editingId === note.id;

                  // Only show the concept being edited
                  if (!isEditing) {
                    return null;
                  }

                  return (
                    <div
                      key={note.id}
                      className="glass-light rounded-lg border border-gray-700/50 overflow-hidden"
                    >
                      <div className="p-5 bg-gradient-to-b from-purple-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-100">
                            {note.text || "Edit Concept"}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={
                                wizardComplete ? cancelEdit : skipConcept
                              }
                              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800/50 transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              {wizardComplete ? "Cancel" : "Skip for Now"}
                            </button>
                            <button
                              onClick={
                                wizardComplete ? saveConcept : saveConceptGuided
                              }
                              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              {!wizardComplete &&
                              guidedIndex < selectedNotes.length - 1
                                ? "Save & Next"
                                : "Save"}
                            </button>
                          </div>
                        </div>

                        {/* Show attached image if available */}
                        {note.image && (
                          <div className="mb-4 p-3 glass-light rounded-lg border border-gray-700/50">
                            <p className="text-xs font-medium text-gray-400 mb-2">
                              Attached Sketch/Image
                            </p>
                            <img
                              src={note.image.dataUrl}
                              alt={note.image.caption || "Concept sketch"}
                              className="w-full max-h-48 object-contain rounded border border-gray-700"
                            />
                            {note.image.caption && (
                              <p className="text-xs text-gray-400 mt-2 italic">
                                {note.image.caption}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">
                              Concept Title{" "}
                              {!wizardComplete && (
                                <span className="text-purple-400">*</span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                (Brief, clear name for your idea)
                              </span>
                            </label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="e.g., Smart Parking Finder App"
                              className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                          </div>

                          {/* Problem */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">
                              What problem does this solve?{" "}
                              {!wizardComplete && (
                                <span className="text-purple-400">*</span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                (Connect to your HMW)
                              </span>
                            </label>
                            <textarea
                              value={editForm.problem}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  problem: e.target.value,
                                })
                              }
                              placeholder="e.g., Users waste time circling parking lots looking for spots, causing frustration and delays..."
                              rows={2}
                              className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Solution */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">
                              How does your concept solve it?{" "}
                              {!wizardComplete && (
                                <span className="text-purple-400">*</span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                (Be specific about your approach)
                              </span>
                            </label>
                            <textarea
                              value={editForm.solution}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  solution: e.target.value,
                                })
                              }
                              placeholder="e.g., A mobile app that uses IoT sensors in parking spots to show real-time availability on a map..."
                              rows={3}
                              className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Optional fields hint in wizard mode */}
                          {!wizardComplete && (
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-300">
                                💡 <strong>Pro tip:</strong> The fields below
                                are optional but will strengthen your concept
                              </p>
                            </div>
                          )}

                          {/* User Value */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">
                              What value does it provide users?
                              <span className="text-xs text-gray-500 ml-2">
                                (Benefits & outcomes)
                              </span>
                            </label>
                            <textarea
                              value={editForm.userValue}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  userValue: e.target.value,
                                })
                              }
                              placeholder="e.g., Saves 10-15 minutes per trip, reduces stress, helps plan arrival time..."
                              rows={2}
                              className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Implementation */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">
                              How could this be implemented?
                              <span className="text-xs text-gray-500 ml-2">
                                (Make it realistic)
                              </span>
                            </label>
                            <textarea
                              value={editForm.implementation}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  implementation: e.target.value,
                                })
                              }
                              placeholder="e.g., Partner with parking lot owners to install simple sensors, develop iOS/Android apps, start with one campus location as pilot..."
                              rows={2}
                              className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proceed Button */}
        </div>
      </div>
    </div>
  );
}
