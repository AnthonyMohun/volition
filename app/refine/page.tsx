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
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 text-6xl float-animation">
          ✨
        </div>
        <div
          className="absolute top-40 right-20 text-5xl float-animation"
          style={{ animationDelay: "1s" }}
        >
          📝
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-5xl float-animation"
          style={{ animationDelay: "2s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-20 right-1/3 text-6xl float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🚀
        </div>
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white to-purple-50/50 border-b-3 border-purple-200 px-6 py-5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/select")}
              className="p-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
              title="Back to selection"
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
                <span className="text-2xl">✏️</span>
                Refine Your Concepts
              </h1>
              <p className="text-sm text-gray-600 font-bold">
                Develop and strengthen your top ideas 💪
              </p>
            </div>
          </div>
          <button
            onClick={handleProceedToFinal}
            disabled={!wizardComplete}
            className="fun-button-primary flex items-center gap-2 font-black disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 shadow-lg hover:shadow-purple whitespace-nowrap"
          >
            Get AI Evaluation
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Wizard View */}
          {!wizardComplete && editingId && (
            <div className="fun-card p-8 border-3 border-purple-200 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/30 to-transparent rounded-full blur-2xl"></div>

              {/* Progress Bar */}
              <div className="mb-8 flex gap-3 relative z-10">
                {selectedNotes.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3 flex-1 rounded-full transition-all duration-500 shadow-sm ${
                      idx < guidedIndex
                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                        : idx === guidedIndex
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {/* HMW Statement */}
              <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-3 border-purple-200 shadow-md relative z-10">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>💭</span> Design Challenge
                </h3>
                <p className="text-gray-800 font-bold leading-relaxed">
                  {state.hmwStatement}
                </p>
              </div>
              {/* Header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="text-base text-gray-700 font-black flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Concept {guidedIndex + 1} of {selectedNotes.length}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={skipConcept}
                    className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 border-3 border-gray-300 rounded-2xl hover:bg-gray-50 transition-all font-black shadow-sm hover:scale-105"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={saveConceptGuided}
                    className="px-5 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all font-black shadow-lg hover:shadow-purple hover:scale-105"
                  >
                    {guidedIndex < selectedNotes.length - 1
                      ? "Save & Next 👉"
                      : "Save & Finish ✨"}
                  </button>
                </div>
              </div>

              {selectedNotes.map((note) => {
                const isEditing = editingId === note.id;

                if (!isEditing) {
                  return null;
                }

                return (
                  <div key={note.id} className="relative z-10">
                    {/* Concept Title Display */}
                    <h4 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                      <span className="text-3xl">💡</span>
                      {note.text || "Edit Concept"}
                    </h4>

                    {/* Show attached image if available */}
                    {note.image && (
                      <div className="mb-8 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-3 border-purple-200 shadow-md">
                        <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-wide flex items-center gap-1">
                          <span>🖼️</span> Attached Sketch/Image
                        </p>
                        <img
                          src={note.image.dataUrl}
                          alt={note.image.caption || "Concept sketch"}
                          className="w-full max-h-64 object-contain rounded-xl border-3 border-white shadow-lg"
                        />
                        {note.image.caption && (
                          <p className="text-xs text-gray-600 mt-3 italic font-semibold">
                            {note.image.caption}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <label className="text-sm font-black text-gray-700 mb-2 block uppercase tracking-wide flex items-center gap-1">
                          <span>✏️</span> Concept Title{" "}
                          <span className="text-purple-500">*</span>
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
                          className="w-full px-4 py-3 bg-white border-3 border-purple-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 transition-all font-bold shadow-sm"
                        />
                      </div>

                      {/* Problem */}
                      <div>
                        <label className="text-sm font-black text-gray-700 mb-2 block uppercase tracking-wide flex items-center gap-1">
                          <span>❓</span> What problem does this solve?{" "}
                          <span className="text-purple-500">*</span>
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
                          className="w-full px-4 py-3 bg-white border-3 border-purple-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 transition-all resize-none font-semibold shadow-sm"
                        />
                      </div>

                      {/* Solution */}
                      <div>
                        <label className="text-sm font-black text-gray-700 mb-2 block uppercase tracking-wide flex items-center gap-1">
                          <span>💡</span> How does your concept solve it?{" "}
                          <span className="text-purple-500">*</span>
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
                          className="w-full px-4 py-3 bg-white border-3 border-purple-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 transition-all resize-none font-semibold shadow-sm"
                        />
                      </div>

                      {/* Divider with optional label */}
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 border-t-3 border-gray-300"></div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-black bg-gray-100 px-3 py-1 rounded-full">
                          Optional
                        </span>
                        <div className="flex-1 border-t-3 border-gray-300"></div>
                      </div>

                      {/* User Value */}
                      <div>
                        <label className="text-sm font-black text-gray-700 mb-2 block uppercase tracking-wide flex items-center gap-1">
                          <span>✨</span> What value does it provide users?
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
                          className="w-full px-4 py-3 bg-white border-3 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 transition-all resize-none font-semibold shadow-sm"
                        />
                      </div>

                      {/* Implementation */}
                      <div>
                        <label className="text-sm font-black text-gray-700 mb-2 block uppercase tracking-wide flex items-center gap-1">
                          <span>🔧</span> How could this be implemented?
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
                          className="w-full px-4 py-3 bg-white border-3 border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 transition-all resize-none font-semibold shadow-sm"
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
            <div className="fun-card p-8 border-3 border-green-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-2xl"></div>
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="bg-gradient-to-br from-green-100 to-emerald-200 p-3 rounded-2xl shadow-md">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">✅</span>
                  Your Refined Concepts
                </h3>
              </div>

              <div className="space-y-5 relative z-10">
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
                      className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border-3 border-purple-200 shadow-md"
                    >
                      {!isEditingConcept ? (
                        <div className="p-5 hover:border-purple-300 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-gray-800 mb-2 text-lg flex items-center gap-2">
                                <span className="text-xl">💡</span>
                                {note.text}
                              </h4>
                              {problemText && (
                                <p className="text-sm text-gray-600 line-clamp-2 font-semibold">
                                  {problemText}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => startEditingConcept(note)}
                              className="p-3 hover:bg-purple-100 rounded-2xl transition-all group flex-shrink-0 shadow-sm hover:scale-110"
                            >
                              <Edit3 className="w-5 h-5 text-purple-500 group-hover:text-purple-700" />
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
