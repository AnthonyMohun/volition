"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import {
  ArrowRight,
  Edit3,
  CheckCircle2,
  ChevronDown,
  Mic,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { motion } from "framer-motion";

interface ConceptEditForm {
  title: string;
  description: string;
  extras: string;
}

// Type for which field is being recorded
type RecordingField = "title" | "description" | "extras" | null;

// Simplified: just title + description, with optional extras

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
    description: "",
    extras: "",
  });
  // New structured fields for extras
  const [targetAudience, setTargetAudience] = useState("");
  const PLATFORM_OPTIONS = [
    "Virtual Reality",
    "Mobile",
    "Tablet",
    "Web",
    "Desktop",
  ];
  const [platform, setPlatform] = useState<string[]>([]);
  const [keyBenefits, setKeyBenefits] = useState("");
  const [mainFeatures, setMainFeatures] = useState("");
  const [showExtras, setShowExtras] = useState(false); // Closed by default
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [wizardComplete, setWizardComplete] = useState(false);
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [recordingField, setRecordingField] = useState<RecordingField>(null);
  const recognitionRef = useRef<any>(null);

  const conceptNotes = state.notes.filter((n) => n.isConcept);

  // Speech recognition for form fields
  const startRecording = useCallback((field: RecordingField) => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && field) {
        setEditForm((prev) => ({
          ...prev,
          [field]: prev[field]
            ? prev[field] + " " + finalTranscript
            : finalTranscript,
        }));
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
      setRecordingField(null);
    };

    recognition.onend = () => {
      setRecordingField(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecordingField(field);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecordingField(null);
  }, []);

  const toggleRecording = useCallback(
    (field: RecordingField) => {
      if (recordingField === field) {
        stopRecording();
      } else {
        startRecording(field);
      }
    },
    [recordingField, startRecording, stopRecording]
  );

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 2) {
      router.push("/canvas");
      return;
    }

    // Get selected concepts from route params or state
    const selectedIds =
      state.selectedConceptIds.length > 0
        ? state.selectedConceptIds
        : conceptNotes.slice(0, 3).map((n) => n.id);

    // If we have selected concepts, start the wizard immediately
    if (selectedIds.length >= 2) {
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
    setShowExtras(false);
    setIsLoadingDescription(true);

    // Prefer structured fields if present
    setTargetAudience(note.targetAudience || "");
    setPlatform(note.platform || []);
    setKeyBenefits(note.keyBenefits || "");
    setMainFeatures(note.mainFeatures || "");

    // Parse details for title, description, extras
    if (note.details && note.details.includes("Description:")) {
      const descMatch = note.details.match(
        /Description:\s*([\s\S]*?)(?=Extras:|$)/
      );
      const extrasMatch = note.details.match(/Extras:\s*([\s\S]*?)$/);

      setEditForm({
        title: note.text,
        description: descMatch ? descMatch[1].trim() : "",
        extras: extrasMatch ? extrasMatch[1].trim() : "",
      });
      // Always keep extra notes section closed by default
    } else {
      setEditForm({
        title: note.text,
        description: note.details || "",
        extras: "",
      });
    }
  };

  const saveConcept = () => {
    if (!editingId) return;
    setIsLoadingDescription(false);

    // Compose structured extras
    const structuredExtras = [
      targetAudience && `Target Audience: ${targetAudience}`,
      platform.length > 0 && `Platform: ${platform.join(", ")}`,
      keyBenefits && `Key Benefits: ${keyBenefits}`,
      mainFeatures && `Main Features: ${mainFeatures}`,
      editForm.extras && editForm.extras,
    ]
      .filter(Boolean)
      .join("\n");

    const detailsText = [
      editForm.description && `Description: ${editForm.description}`,
      structuredExtras && `Extras: ${structuredExtras}`,
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

  if (!state.hmwStatement || conceptNotes.length < 2) {
    return null;
  }

  return (
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-teal-300/15 rounded-full blur-3xl float-animation" />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gradient-to-br from-purple-300/15 to-pink-300/15 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Floating emojis - subtle */}
        <div className="absolute top-24 left-[8%] text-4xl opacity-10 float-animation">
          ✨
        </div>
        <div
          className="absolute top-32 right-[12%] text-3xl opacity-10 float-animation"
          style={{ animationDelay: "1s" }}
        >
          📝
        </div>
        <div
          className="absolute bottom-40 left-[15%] text-3xl opacity-10 float-animation"
          style={{ animationDelay: "2s" }}
        >
          💡
        </div>
      </div>

      <PageHeader
        title="Refine Concepts"
        icon={<Pencil className="w-5 h-5 text-teal-500" />}
        backPath="/select"
        onNewProject={handleStartNewProject}
        rightContent={
          <button
            onClick={handleProceedToFinal}
            disabled={!wizardComplete}
            className="fun-button-primary flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5"
          >
            Rate Concepts ⭐
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start md:items-center">
        <div className="w-full max-w-4xl">
          {/* Wizard View */}
          {!wizardComplete && editingId && (
            <div
              className="fun-card p-4 md:p-6 mb-6 relative overflow-hidden mx-auto border-3 border-blue-200"
              style={{
                width: "100%",
                maxWidth: "600px",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

              {/* Progress Bar */}
              <div className="mb-5 flex gap-2 relative z-10">
                {selectedNotes.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      idx < guidedIndex
                        ? "bg-gradient-to-r from-teal-400 to-emerald-400"
                        : idx === guidedIndex
                        ? "bg-gradient-to-r from-blue-400 to-teal-400"
                        : "bg-gray-200/80"
                    }`}
                    style={{
                      boxShadow:
                        idx <= guidedIndex
                          ? "0 1px 3px rgba(20, 184, 166, 0.2)"
                          : "none",
                    }}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4 md:mb-5 relative z-10 flex-wrap gap-2">
                <div className="text-sm text-gray-500 font-semibold">
                  Concept {guidedIndex + 1} of {selectedNotes.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={skipConcept}
                    className="px-4 py-2.5 md:py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100/80 transition-all font-semibold touch-manipulation"
                  >
                    Skip
                  </button>
                  <button
                    onClick={saveConceptGuided}
                    className="px-4 py-2.5 md:py-2 text-sm text-white rounded-xl transition-all font-bold touch-manipulation"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)",
                      boxShadow:
                        "0 2px 8px rgba(59, 130, 246, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
                    }}
                  >
                    {guidedIndex < selectedNotes.length - 1
                      ? "Next →"
                      : "Done ✓"}
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
                    {/* Show attached image and/or sketch if available */}
                    {(note.image || note.drawing?.dataUrl) && (
                      <div className="mb-6 p-4 rounded-2xl flex gap-4 bg-gradient-to-br from-blue-50/80 to-teal-50/60 border-2 border-blue-100">
                        {note.image && !note.drawing?.dataUrl && (
                          <img
                            src={note.image.dataUrl}
                            alt={note.image.caption || "Concept image"}
                            className="w-full max-h-48 object-contain rounded-xl border-2 border-white shadow-md"
                          />
                        )}
                        {note.drawing?.dataUrl && !note.image && (
                          <img
                            src={note.drawing.dataUrl}
                            alt="Concept sketch"
                            className="w-full max-h-48 object-contain rounded-xl border-2 border-white shadow-md bg-white"
                          />
                        )}
                        {note.image && note.drawing?.dataUrl && (
                          <>
                            <img
                              src={note.image.dataUrl}
                              alt={note.image.caption || "Concept image"}
                              className="w-1/2 max-h-48 object-contain rounded-xl border-2 border-white shadow-md"
                            />
                            <img
                              src={note.drawing.dataUrl}
                              alt={
                                note.image.caption
                                  ? `${note.image.caption} (sketch)`
                                  : "Concept sketch"
                              }
                              className="w-1/2 max-h-48 object-contain rounded-xl border-2 border-white shadow-md bg-white"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Simplified Form - Just 2 main fields */}
                    <div className="space-y-5">
                      {/* Title */}
                      <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block flex items-center gap-2 uppercase tracking-wide">
                          <span>💡</span> Concept Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                title: e.target.value,
                              })
                            }
                            placeholder="Give your idea a catchy name"
                            className="w-full px-4 py-3 md:py-3 pr-14 rounded-2xl text-gray-800 text-base md:text-lg placeholder:text-gray-400 transition-all font-semibold touch-manipulation bg-white border-2 border-blue-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 shadow-sm"
                          />
                          <button
                            onClick={() => toggleRecording("title")}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-2 rounded-xl transition-all touch-manipulation ${
                              recordingField === "title"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "text-teal-600 hover:bg-teal-50 bg-teal-50 border border-teal-200"
                            }`}
                            title={
                              recordingField === "title"
                                ? "Stop recording"
                                : "Start recording"
                            }
                          >
                            {recordingField === "title" ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <Mic className="w-5 h-5 md:w-4 md:h-4" />
                              </motion.div>
                            ) : (
                              <Mic className="w-5 h-5 md:w-4 md:h-4" />
                            )}
                          </button>
                        </div>
                        {recordingField === "title" && (
                          <p className="text-xs text-teal-600 mt-1.5 font-medium animate-pulse">
                            🎤 Listening...
                          </p>
                        )}
                      </div>
                      {/* Gradient skeleton for concept description loading */}

                      {/* Description - combines problem + solution */}
                      <div>
                        <label className="text-xs font-bold text-gray-600 mb-2 block flex items-center gap-2 uppercase tracking-wide">
                          <span>📝</span> What&apos;s the idea?
                        </label>
                        <div className="relative">
                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe your concept in a few sentences..."
                            rows={6}
                            className="w-full px-4 py-3 pr-14 rounded-2xl text-gray-800 text-base placeholder:text-gray-400 transition-all resize-none font-medium touch-manipulation bg-white border-2 border-blue-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-300 shadow-sm"
                          />
                          <button
                            onClick={() => toggleRecording("description")}
                            className={`absolute right-3 top-3 p-2.5 md:p-2 rounded-xl transition-all touch-manipulation ${
                              recordingField === "description"
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "text-teal-600 hover:bg-teal-50 bg-teal-50 border border-teal-200"
                            }`}
                            title={
                              recordingField === "description"
                                ? "Stop recording"
                                : "Start recording"
                            }
                          >
                            {recordingField === "description" ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <Mic className="w-5 h-5 md:w-4 md:h-4" />
                              </motion.div>
                            ) : (
                              <Mic className="w-5 h-5 md:w-4 md:h-4" />
                            )}
                          </button>
                        </div>
                        {recordingField === "description" && (
                          <p className="text-xs text-teal-600 mt-1.5 font-medium animate-pulse">
                            🎤 Listening...
                          </p>
                        )}
                      </div>

                      {/* Collapsible extras */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowExtras(!showExtras)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-teal-600 transition-colors py-2 touch-manipulation"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              showExtras ? "rotate-180" : ""
                            }`}
                          />
                          {showExtras ? "Hide" : "Add"} extra details
                        </button>

                        {showExtras && (
                          <div
                            className="space-y-4 mt-3 p-4 rounded-xl"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.6) 100%)",
                              border: "1px solid rgba(226, 232, 240, 0.6)",
                            }}
                          >
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                Target Audience
                              </label>
                              <input
                                type="text"
                                value={targetAudience}
                                onChange={(e) =>
                                  setTargetAudience(e.target.value)
                                }
                                placeholder="Who is this for?"
                                className="w-full px-3 py-3 md:py-2.5 bg-white/80 border border-gray-200/80 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all text-sm touch-manipulation"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                                Platform
                              </label>
                              <div className="flex flex-wrap gap-3 md:gap-2">
                                {PLATFORM_OPTIONS.map((option) => (
                                  <label
                                    key={option}
                                    className="flex items-center gap-2 md:gap-1.5 text-sm font-medium text-gray-600 py-1 touch-manipulation cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={platform.includes(option)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPlatform([...platform, option]);
                                        } else {
                                          setPlatform(
                                            platform.filter((p) => p !== option)
                                          );
                                        }
                                      }}
                                      className="accent-teal-500 w-5 h-5 md:w-4 md:h-4 rounded"
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                Key Benefits
                              </label>
                              <input
                                type="text"
                                value={keyBenefits}
                                onChange={(e) => setKeyBenefits(e.target.value)}
                                placeholder="Main advantages or value"
                                className="w-full px-3 py-3 md:py-2.5 bg-white/80 border border-gray-200/80 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all text-sm touch-manipulation"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                Main Features
                              </label>
                              <input
                                type="text"
                                value={mainFeatures}
                                onChange={(e) =>
                                  setMainFeatures(e.target.value)
                                }
                                placeholder="Core features of the concept"
                                className="w-full px-3 py-3 md:py-2.5 bg-white/80 border border-gray-200/80 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all text-sm touch-manipulation"
                              />
                            </div>
                            <div className="relative">
                              <textarea
                                value={editForm.extras}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    extras: e.target.value,
                                  })
                                }
                                placeholder="Other notes, technical ideas, etc. (optional)"
                                rows={2}
                                className="w-full px-4 py-3 pr-14 bg-white border-2 border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all resize-none text-sm mt-2 touch-manipulation"
                              />
                              <button
                                onClick={() => toggleRecording("extras")}
                                className={`absolute right-3 top-5 p-2.5 md:p-2 rounded-xl transition-all touch-manipulation ${
                                  recordingField === "extras"
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "text-teal-600 hover:bg-teal-50 bg-teal-50 border border-teal-200"
                                }`}
                                title={
                                  recordingField === "extras"
                                    ? "Stop recording"
                                    : "Start recording"
                                }
                              >
                                {recordingField === "extras" ? (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 1,
                                    }}
                                  >
                                    <Mic className="w-5 h-5 md:w-4 md:h-4" />
                                  </motion.div>
                                ) : (
                                  <Mic className="w-5 h-5 md:w-4 md:h-4" />
                                )}
                              </button>
                              {recordingField === "extras" && (
                                <p className="text-xs text-teal-600 mt-1.5 font-medium animate-pulse">
                                  🎤 Listening...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed View */}
          {wizardComplete && (
            <div className="fun-card p-4 md:p-6 relative overflow-hidden border-3 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

              <div className="flex items-center gap-3 mb-5 md:mb-6 relative z-10">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(209,250,229,0.9) 0%, rgba(167,243,208,0.7) 100%)",
                    boxShadow:
                      "0 2px 6px rgba(16, 185, 129, 0.15), inset 0 1px 1px rgba(255,255,255,0.5)",
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  Ready to Rate! ✨
                </h3>
              </div>

              <div className="space-y-3 relative z-10">
                {selectedNotes.map((note) => {
                  // Parse description from details
                  let descText = "";
                  if (note.details?.includes("Description:")) {
                    const match = note.details.match(
                      /Description:\s*([\s\S]*?)(?=Extras:|$)/
                    );
                    if (match) descText = match[1].trim();
                  } else {
                    descText = note.details || "";
                  }

                  return (
                    <div
                      key={note.id}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all group"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)",
                        border: "1px solid rgba(226, 232, 240, 0.6)",
                        boxShadow:
                          "0 2px 6px rgba(163, 177, 198, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                          <span>💡</span>
                          {note.text}
                        </h4>
                        {descText && (
                          <p className="text-xs md:text-sm text-gray-500 truncate mt-1">
                            {descText}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => startEditingConcept(note)}
                        className="p-2.5 md:p-2 md:opacity-0 md:group-hover:opacity-100 hover:bg-teal-50 rounded-xl transition-all touch-manipulation"
                      >
                        <Edit3 className="w-5 h-5 md:w-4 md:h-4 text-teal-500" />
                      </button>
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
