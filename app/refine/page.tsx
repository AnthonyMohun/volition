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
  Sparkles,
  Send,
  Loader2,
  Wand2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { motion, AnimatePresence } from "framer-motion";
import {
  askRefineQuestion,
  generateConceptDescription,
  suggestConceptExtras,
} from "@/lib/ai-client";
import { speak, stopSpeaking, isSpeechSynthesisSupported } from "@/lib/speech";

interface ConceptEditForm {
  title: string;
  description: string;
  extras: string;
}

// Type for which field is being recorded
type RecordingField = "title" | "description" | "extras" | null;

// Conversation item for AI scaffolding
interface ConversationItem {
  type: "ai" | "user";
  text: string;
}

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

  // AI Scaffolding state
  const [showAIScaffold, setShowAIScaffold] = useState(true);
  const [aiConversation, setAiConversation] = useState<ConversationItem[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [aiAnswers, setAiAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingExtras, setIsSuggestingExtras] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [isRecordingAI, setIsRecordingAI] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const aiRecognitionRef = useRef<any>(null);

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

  // Scroll conversation to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiConversation]);

  // TTS helper for AI messages
  const speakAIMessage = async (text: string) => {
    if (isMuted) return;
    if (isSpeechSynthesisSupported()) {
      try {
        await speak(text);
      } catch (err) {
        console.warn("TTS failed:", err);
      }
    }
  };

  // Toggle mute and stop any current speech
  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  // Voice input handlers for AI conversation
  const startAIVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    if (aiRecognitionRef.current) {
      aiRecognitionRef.current.stop();
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
      if (finalTranscript) {
        setUserInput((prev) =>
          prev ? prev + " " + finalTranscript : finalTranscript
        );
      }
    };

    recognition.onerror = () => setIsRecordingAI(false);
    recognition.onend = () => setIsRecordingAI(false);

    aiRecognitionRef.current = recognition;
    recognition.start();
    setIsRecordingAI(true);
  };

  const stopAIVoiceInput = () => {
    if (aiRecognitionRef.current) {
      aiRecognitionRef.current.stop();
      aiRecognitionRef.current = null;
    }
    setIsRecordingAI(false);
  };

  // Start AI conversation when editing a new concept
  const startAIScaffolding = async (note: (typeof conceptNotes)[0]) => {
    setAiConversation([]);
    setAiAnswers([]);
    setQuestionIndex(0);
    setIsAILoading(true);

    try {
      const question = await askRefineQuestion(note.text, note.text, [], 0);
      setAiConversation([{ type: "ai", text: question }]);
      speakAIMessage(question);
    } catch (error) {
      const fallbackMsg =
        "What does this concept actually do? Describe it simply.";
      setAiConversation([{ type: "ai", text: fallbackMsg }]);
      speakAIMessage(fallbackMsg);
    }
    setIsAILoading(false);
  };

  const handleAIResponse = async () => {
    if (!userInput.trim() || isAILoading) return;

    const currentNote = selectedNotes[guidedIndex];
    if (!currentNote) return;

    const currentQuestion =
      aiConversation[aiConversation.length - 1]?.text || "";
    const newAnswers = [
      ...aiAnswers,
      { question: currentQuestion, answer: userInput.trim() },
    ];
    setAiAnswers(newAnswers);

    setAiConversation((prev) => [
      ...prev,
      { type: "user", text: userInput.trim() },
    ]);
    setUserInput("");

    const nextQuestionIdx = questionIndex + 1;

    // After 3 questions, auto-generate description to reduce writing burden
    if (nextQuestionIdx >= 3) {
      // Auto-generate the description
      setIsAILoading(true);
      setQuestionIndex(nextQuestionIdx);
      setAiConversation((prev) => [
        ...prev,
        {
          type: "ai",
          text: "✨ Let me write your description based on what you've told me...",
        },
      ]);
      speakAIMessage(
        "Let me write your description based on what you've told me."
      );

      try {
        const description = await generateConceptDescription(
          editForm.title || currentNote.text,
          currentNote.text,
          newAnswers
        );

        if (description) {
          setEditForm((prev) => ({ ...prev, description }));
          setAiConversation((prev) => [
            ...prev,
            {
              type: "ai",
              text: `Here's your description:\n\n"${description}"\n\nFeel free to edit it, or click 'Next' to continue!`,
            },
          ]);
          speakAIMessage(
            "Done! I've added the description. Feel free to edit it or move on."
          );
        } else {
          setAiConversation((prev) => [
            ...prev,
            {
              type: "ai",
              text: "I couldn't generate a description. Try writing one based on our conversation!",
            },
          ]);
        }
      } catch (error) {
        setAiConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: "Something went wrong. Try writing the description manually.",
          },
        ]);
      }
      setIsAILoading(false);
    } else {
      setIsAILoading(true);
      setQuestionIndex(nextQuestionIdx);

      try {
        const question = await askRefineQuestion(
          currentNote.text,
          currentNote.text,
          newAnswers,
          nextQuestionIdx
        );
        setAiConversation((prev) => [...prev, { type: "ai", text: question }]);
        speakAIMessage(question);
      } catch (error) {
        const fallbacks = [
          "What does this concept actually do?",
          "Who would benefit from this?",
          "What makes this unique?",
        ];
        const fallbackMsg =
          fallbacks[nextQuestionIdx] || "Tell me more about this idea.";
        setAiConversation((prev) => [
          ...prev,
          { type: "ai", text: fallbackMsg },
        ]);
        speakAIMessage(fallbackMsg);
      }
      setIsAILoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    const currentNote = selectedNotes[guidedIndex];
    if (!currentNote || aiAnswers.length === 0) return;

    setIsGeneratingDescription(true);
    setAiConversation((prev) => [
      ...prev,
      { type: "ai", text: "📝 Writing your description..." },
    ]);

    try {
      const description = await generateConceptDescription(
        editForm.title || currentNote.text,
        currentNote.text,
        aiAnswers
      );

      if (description) {
        setEditForm((prev) => ({ ...prev, description }));
        setAiConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Here's your description:\n\n"${description}"\n\nFeel free to edit it in the form!`,
          },
        ]);
      } else {
        setAiConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: "I couldn't generate a description. Try writing one based on our conversation!",
          },
        ]);
      }
    } catch (error) {
      setAiConversation((prev) => [
        ...prev,
        {
          type: "ai",
          text: "Something went wrong. Try writing the description manually.",
        },
      ]);
    }
    setIsGeneratingDescription(false);
  };

  // Handler to suggest extras using AI
  const handleSuggestExtras = async () => {
    const currentNote = selectedNotes[guidedIndex];
    if (!currentNote || !editForm.description) return;

    setIsSuggestingExtras(true);
    try {
      const suggestions = await suggestConceptExtras(
        editForm.title || currentNote.text,
        editForm.description,
        state.hmwStatement
      );

      if (suggestions.targetAudience)
        setTargetAudience(suggestions.targetAudience);
      if (suggestions.platforms.length > 0) setPlatform(suggestions.platforms);
      if (suggestions.keyBenefits) setKeyBenefits(suggestions.keyBenefits);
      if (suggestions.mainFeatures) setMainFeatures(suggestions.mainFeatures);

      // Speak confirmation
      speakAIMessage(
        "I've filled in some suggestions. Feel free to edit them!"
      );
    } catch (error) {
      console.error("Suggest extras failed:", error);
    }
    setIsSuggestingExtras(false);
  };

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
    setShowAIScaffold(true);

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
      // If already has description, don't show AI scaffold
      if (descMatch && descMatch[1].trim()) {
        setShowAIScaffold(false);
      }
      // Always keep extra notes section closed by default
    } else {
      setEditForm({
        title: note.text,
        description: note.details || "",
        extras: "",
      });
      // Start AI scaffolding for empty descriptions
      if (!note.details) {
        startAIScaffolding(note);
      } else {
        setShowAIScaffold(false);
      }
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

                      {/* AI Scaffolding Panel */}
                      <AnimatePresence>
                        {showAIScaffold && aiConversation.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gradient-to-br from-teal-50/80 to-blue-50/80 border-2 border-teal-200 rounded-2xl overflow-hidden"
                          >
                            {/* Volition Header */}
                            <div className="px-4 py-2.5 bg-gradient-to-r from-teal-100/80 to-blue-100/80 border-b border-teal-200/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="font-bold text-teal-800 text-xs">
                                  Volition Description Helper
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={toggleMute}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isMuted
                                      ? "text-red-500 bg-red-50 hover:bg-red-100"
                                      : "text-teal-600 hover:bg-teal-100"
                                  }`}
                                  title={
                                    isMuted ? "Unmute voice" : "Mute voice"
                                  }
                                >
                                  {isMuted ? (
                                    <VolumeX className="w-3.5 h-3.5" />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAIScaffold(false)}
                                  className="text-xs font-semibold text-teal-600 hover:text-teal-800 px-2 py-1 hover:bg-teal-100 rounded-lg transition-all"
                                >
                                  Write manually
                                </button>
                              </div>
                            </div>

                            {/* Conversation */}
                            <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                              {aiConversation.map((item, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${
                                    item.type === "user"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs font-medium ${
                                      item.type === "user"
                                        ? "bg-teal-600 text-white rounded-br-sm"
                                        : "bg-white text-gray-700 rounded-bl-sm shadow-sm border border-gray-100"
                                    }`}
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {item.text}
                                  </div>
                                </motion.div>
                              ))}
                              {isAILoading && (
                                <div className="flex justify-start">
                                  <div className="bg-white px-3 py-2 rounded-xl rounded-bl-sm shadow-sm border border-gray-100 flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                                    <span className="text-xs text-gray-500">
                                      Thinking...
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div ref={conversationEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-2.5 border-t border-teal-200/50 bg-white/50">
                              {questionIndex >= 3 ? (
                                <div className="flex gap-2 items-center justify-center">
                                  <span className="text-xs text-gray-500 font-medium">
                                    ✅ Description generated! Edit below or
                                    click Next.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAIScaffold(false)}
                                    className="px-3 py-2 bg-teal-100 text-teal-700 font-bold text-xs rounded-xl hover:bg-teal-200 transition-all"
                                  >
                                    Close helper
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) =>
                                      setUserInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAIResponse();
                                      }
                                    }}
                                    placeholder="Type or speak..."
                                    className="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 transition-all text-xs font-medium"
                                    disabled={isAILoading}
                                  />
                                  <button
                                    type="button"
                                    onClick={
                                      isRecordingAI
                                        ? stopAIVoiceInput
                                        : startAIVoiceInput
                                    }
                                    disabled={isAILoading}
                                    className={`px-2.5 py-2 rounded-xl transition-all ${
                                      isRecordingAI
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                    title={
                                      isRecordingAI
                                        ? "Stop recording"
                                        : "Voice input"
                                    }
                                  >
                                    {isRecordingAI ? (
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{
                                          repeat: Infinity,
                                          duration: 1,
                                        }}
                                      >
                                        <Mic className="w-3.5 h-3.5" />
                                      </motion.div>
                                    ) : (
                                      <Mic className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleAIResponse}
                                    disabled={!userInput.trim() || isAILoading}
                                    className="px-3 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

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
                            {/* AI Suggest Button */}
                            <button
                              type="button"
                              onClick={handleSuggestExtras}
                              disabled={
                                isSuggestingExtras || !editForm.description
                              }
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 hover:border-teal-300 rounded-xl text-teal-700 font-semibold text-xs transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSuggestingExtras ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {isSuggestingExtras
                                  ? "Suggesting..."
                                  : "Let Volition suggest details"}
                              </span>
                            </button>

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
