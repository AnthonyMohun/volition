"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import {
  ArrowLeft,
  ListRestart,
  Lightbulb,
  ArrowRight,
  Edit3,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";

interface ConceptEditForm {
  title: string;
  problem: string;
  solution: string;
  userValue: string;
  implementation: string;
}

export default function RefinePage() {
  const router = useRouter();
  const {
    state,
    setPhase,
    updateNote,
    setSelectedConcepts: saveSelectedConcepts,
  } = useSession();

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
      return;
    }

    // Get selected concepts from route params or state
    const selectedIds =
      state.selectedConceptIds.length > 0
        ? state.selectedConceptIds
        : conceptNotes.slice(0, 3).map((n) => n.id);

    // If we have selected concepts, start the wizard immediately
    if (selectedIds.length === 3) {
      const firstNote = conceptNotes.find((n) => n.id === selectedIds[0]);
      if (firstNote) {
        startEditingConcept(firstNote);
      }
    }
  }, [
    state.hmwStatement,
    conceptNotes.length,
    router,
    state.selectedConceptIds,
  ]);

  const selectedNotes = (
    state.selectedConceptIds.length > 0
      ? state.selectedConceptIds
      : conceptNotes.slice(0, 3)
  )
    .map((id) => conceptNotes.find((n) => n.id === id))
    .filter((n) => n !== undefined) as typeof conceptNotes;

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

  const handleProceedToFinal = () => {
    saveSelectedConcepts(state.selectedConceptIds, {});
    setPhase("final");
    router.push("/final");
  };

  const handleStartNewProject = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      router.push("/");
    }
  };

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null;
  }

  return (
    <div className="min-h-screen dark-gradient-radial texture-overlay flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-800 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/select")}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
              title="Back to selection"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </button>
            <button
              onClick={handleStartNewProject}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
              title="Start a new project"
            >
              <ListRestart className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-100">
                Refine Your Concepts
              </h1>
              <p className="text-sm text-gray-400">
                Develop and strengthen your top ideas
              </p>
            </div>
          </div>
          <button
            onClick={handleProceedToFinal}
            disabled={!wizardComplete}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium silver-glow whitespace-nowrap"
          >
            Get AI Evaluation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Wizard View */}
          {!wizardComplete && editingId && (
            <div className="glass rounded-xl p-8 border border-gray-700/50 mb-6">
              {/* Progress Bar */}
              <div className="mb-6 flex gap-1.5">
                {selectedNotes.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx < guidedIndex
                        ? "bg-emerald-500/70"
                        : idx === guidedIndex
                        ? "bg-purple-500/70"
                        : "bg-gray-700/40"
                    }`}
                  />
                ))}
              </div>
              {/* HMW Statement */}
              <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                  DESIGN CHALLENGE
                </h3>
                <p className="text-gray-100 font-medium leading-relaxed">
                  {state.hmwStatement}
                </p>
              </div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-400">
                  Concept {guidedIndex + 1} of {selectedNotes.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={skipConcept}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={saveConceptGuided}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all font-medium"
                  >
                    {guidedIndex < selectedNotes.length - 1
                      ? "Save & Next"
                      : "Save & Finish"}
                  </button>
                </div>
              </div>

              {selectedNotes.map((note) => {
                const isEditing = editingId === note.id;

                if (!isEditing) {
                  return null;
                }

                return (
                  <div key={note.id}>
                    {/* Concept Title Display */}
                    <h4 className="text-xl font-semibold text-gray-100 mb-6">
                      {note.text || "Edit Concept"}
                    </h4>

                    {/* Show attached image if available */}
                    {note.image && (
                      <div className="mb-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
                        <p className="text-xs font-medium text-gray-400 mb-3">
                          Attached Sketch/Image
                        </p>
                        <img
                          src={note.image.dataUrl}
                          alt={note.image.caption || "Concept sketch"}
                          className="w-full max-h-64 object-contain rounded border border-gray-700"
                        />
                        {note.image.caption && (
                          <p className="text-xs text-gray-400 mt-3 italic">
                            {note.image.caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Concept Title{" "}
                          <span className="text-purple-400">*</span>
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
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                      </div>

                      {/* Problem */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          What problem does this solve?{" "}
                          <span className="text-purple-400">*</span>
                        </label>
                        <textarea
                          value={editForm.problem}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              problem: e.target.value,
                            })
                          }
                          placeholder="Describe the problem your concept addresses..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                        />
                      </div>

                      {/* Solution */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          How does your concept solve it?{" "}
                          <span className="text-purple-400">*</span>
                        </label>
                        <textarea
                          value={editForm.solution}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              solution: e.target.value,
                            })
                          }
                          placeholder="Explain your solution approach..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                        />
                      </div>

                      {/* Divider with optional label */}
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 border-t border-gray-700"></div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          Optional
                        </span>
                        <div className="flex-1 border-t border-gray-700"></div>
                      </div>

                      {/* User Value */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          What value does it provide users?
                        </label>
                        <textarea
                          value={editForm.userValue}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              userValue: e.target.value,
                            })
                          }
                          placeholder="Describe the benefits and outcomes..."
                          rows={2}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                        />
                      </div>

                      {/* Implementation */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          How could this be implemented?
                        </label>
                        <textarea
                          value={editForm.implementation}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              implementation: e.target.value,
                            })
                          }
                          placeholder="Outline realistic implementation steps..."
                          rows={2}
                          className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed View */}
          {wizardComplete && (
            <div className="glass rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-gray-100">
                  Your Refined Concepts
                </h3>
              </div>

              <div className="space-y-4">
                {selectedNotes.map((note) => {
                  const isEditingConcept = editingId === note.id;
                  // Parse problem from details
                  let problemText = "";
                  if (note.details?.includes("Problem:")) {
                    const match = note.details.match(/Problem:\s*([^\n]+)/);
                    if (match) problemText = match[1];
                  }

                  return (
                    <div
                      key={note.id}
                      className="glass-light rounded-lg border border-gray-700/50"
                    >
                      {!isEditingConcept ? (
                        <div className="p-4 hover:border-gray-600 transition-colors">
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
                            </div>
                            <button
                              onClick={() => startEditingConcept(note)}
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group flex-shrink-0"
                            >
                              <Edit3 className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          {/* Title */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              Concept Title
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
                              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            />
                          </div>

                          {/* Problem */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              What problem does this solve?
                            </label>
                            <textarea
                              value={editForm.problem}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  problem: e.target.value,
                                })
                              }
                              placeholder="Describe the problem your concept addresses..."
                              rows={3}
                              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Solution */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              How does your concept solve it?
                            </label>
                            <textarea
                              value={editForm.solution}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  solution: e.target.value,
                                })
                              }
                              placeholder="Explain your solution approach..."
                              rows={3}
                              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Divider with optional label */}
                          <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 border-t border-gray-700"></div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                              Optional
                            </span>
                            <div className="flex-1 border-t border-gray-700"></div>
                          </div>

                          {/* User Value */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              What value does it provide users?
                            </label>
                            <textarea
                              value={editForm.userValue}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  userValue: e.target.value,
                                })
                              }
                              placeholder="Describe the benefits and outcomes..."
                              rows={2}
                              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Implementation */}
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                              How could this be implemented?
                            </label>
                            <textarea
                              value={editForm.implementation}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  implementation: e.target.value,
                                })
                              }
                              placeholder="Outline realistic implementation steps..."
                              rows={2}
                              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => {
                                saveConcept();
                                setEditingId(null);
                              }}
                              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all font-medium"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800/50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
