"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "@/components/hmw-helper-modal";
import { CrazyEightsModal } from "@/components/crazy-eights-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { EXAMPLE_SESSION_DATA } from "@/lib/example-data";
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  Send,
  Loader2,
  ArrowRight,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { askHMWBuilderQuestion, generateHMWStatement } from "@/lib/ai-client";
import { motion, AnimatePresence } from "framer-motion";
import { speak, stopSpeaking, isSpeechSynthesisSupported } from "@/lib/speech";

type HMWBuilderStep = "who" | "what" | "context";

interface ConversationItem {
  type: "ai" | "user";
  text: string;
}

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

  // AI HMW Builder state
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiConversation, setAiConversation] = useState<ConversationItem[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<HMWBuilderStep>("who");
  const [answers, setAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [generatedHMW, setGeneratedHMW] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Voice input state
  const [isRecordingInput, setIsRecordingInput] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiConversation]);

  // Start AI conversation when builder opens
  useEffect(() => {
    if (showAIBuilder && aiConversation.length === 0) {
      startAIConversation();
    }
  }, [showAIBuilder]);

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

  // Voice input handlers
  const startVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

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
      if (finalTranscript) {
        setUserInput((prev) =>
          prev ? prev + " " + finalTranscript : finalTranscript
        );
      }
    };

    recognition.onerror = () => setIsRecordingInput(false);
    recognition.onend = () => setIsRecordingInput(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecordingInput(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecordingInput(false);
  };

  const startAIConversation = async () => {
    setIsAILoading(true);
    try {
      const question = await askHMWBuilderQuestion([], "who");
      setAiConversation([{ type: "ai", text: question }]);
      speakAIMessage(question);
    } catch (error) {
      const fallbackMsg =
        "Who are you designing for? Think about a specific group of people.";
      setAiConversation([{ type: "ai", text: fallbackMsg }]);
      speakAIMessage(fallbackMsg);
    }
    setIsAILoading(false);
  };

  const handleUserResponse = async () => {
    if (!userInput.trim() || isAILoading) return;

    const currentQuestion =
      aiConversation[aiConversation.length - 1]?.text || "";
    const newAnswers = [
      ...answers,
      { question: currentQuestion, answer: userInput.trim() },
    ];
    setAnswers(newAnswers);

    setAiConversation((prev) => [
      ...prev,
      { type: "user", text: userInput.trim() },
    ]);
    setUserInput("");
    setIsAILoading(true);

    // Determine next step - only 3 questions, then generate HMW
    const steps: HMWBuilderStep[] = ["who", "what", "context"];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      // Ask next question
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);

      try {
        const question = await askHMWBuilderQuestion(newAnswers, nextStep);
        setAiConversation((prev) => [...prev, { type: "ai", text: question }]);
        speakAIMessage(question);
      } catch (error) {
        const fallbacks: Record<HMWBuilderStep, string> = {
          who: "Who are you designing for?",
          what: "What challenge do they face?",
          context: "When or where does this happen?",
        };
        const fallbackMsg = fallbacks[nextStep];
        setAiConversation((prev) => [
          ...prev,
          { type: "ai", text: fallbackMsg },
        ]);
        speakAIMessage(fallbackMsg);
      }
    } else {
      // After 3rd answer (context), generate HMW immediately
      setAiConversation((prev) => [
        ...prev,
        { type: "ai", text: "✨ Let me craft your HMW statement..." },
      ]);
      try {
        const hmw = await generateHMWStatement(newAnswers);
        setGeneratedHMW(hmw);
        const resultMsg = `Here's your challenge: ${hmw}`;
        setAiConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Here's your challenge:\n\n"${hmw}"`,
          },
        ]);
        speakAIMessage(resultMsg);
      } catch (error) {
        // Fallback: construct basic HMW from answers
        const fallbackHMW = `How might we help ${
          newAnswers[0]?.answer || "users"
        } with ${newAnswers[1]?.answer || "their challenge"}?`;
        setGeneratedHMW(fallbackHMW);
        const resultMsg = `Here's your challenge: ${fallbackHMW}`;
        setAiConversation((prev) => [
          ...prev,
          {
            type: "ai",
            text: `Here's your challenge:\n\n"${fallbackHMW}"`,
          },
        ]);
        speakAIMessage(resultMsg);
      }
    }
    setIsAILoading(false);
  };

  const handleUseGeneratedHMW = () => {
    if (generatedHMW) {
      resetSession();
      updateHMW(generatedHMW);
      setPhase("canvas");
      router.push("/canvas");
    }
  };

  const resetAIBuilder = () => {
    setAiConversation([]);
    setAnswers([]);
    setCurrentStep("who");
    setGeneratedHMW("");
    setUserInput("");
    startAIConversation();
  };

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
    <div className="min-h-screen volition-hero-bg flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <img
        src="/corner-art.png"
        alt=""
        aria-hidden="true"
        className="volition-corner-art"
        loading="lazy"
        decoding="async"
      />

      <div className="max-w-3xl w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <img
            src="/logo-text.png"
            alt="Volition"
            className="h-32 md:h-36 mx-auto mb-3 md:mb-4 drop-shadow-lg"
          />
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

              {/* AI Builder Toggle */}
              <AnimatePresence mode="wait">
                {!showAIBuilder ? (
                  <motion.div
                    key="textarea"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <textarea
                      id="hmw"
                      value={hmwInput}
                      onChange={(e) => setHmwInput(e.target.value)}
                      placeholder="✏️ Frame your challenge as a 'How Might We' statement to begin..."
                      className="w-full px-4 md:px-6 py-4 md:py-5 bg-gradient-to-br from-white to-gray-50/50 border-3 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none text-gray-800 placeholder:text-gray-400 transition-all text-base md:text-lg font-semibold shadow-sm hover:shadow-md touch-manipulation"
                      rows={3}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAIBuilder(true)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 hover:border-teal-300 rounded-xl text-teal-700 font-semibold text-sm transition-all hover:shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Need help? Let Volition guide you</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ai-builder"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(145deg, #f0fdfa 0%, #eff6ff 100%)",
                      borderRadius: "24px",
                      border: "3px solid rgba(153, 246, 228, 0.6)",
                      boxShadow:
                        "8px 8px 16px rgba(163, 177, 198, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.9), inset 2px 2px 4px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(163, 177, 198, 0.1)",
                    }}
                  >
                    {/* Volition Builder Header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(204, 251, 241, 0.8) 0%, rgba(219, 234, 254, 0.8) 100%)",
                        borderBottom: "2px solid rgba(153, 246, 228, 0.4)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          <Sparkles className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="font-bold text-teal-800 text-sm">
                          Volition Challenge Builder
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={`p-1.5 rounded-lg transition-all ${
                            isMuted
                              ? "text-red-500 bg-red-50 hover:bg-red-100"
                              : "text-teal-600 hover:bg-teal-100"
                          }`}
                          title={isMuted ? "Unmute voice" : "Mute voice"}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={resetAIBuilder}
                          className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg transition-all"
                          title="Start over"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAIBuilder(false)}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800 px-2 py-1 hover:bg-teal-100 rounded-lg transition-all"
                        >
                          Write manually
                        </button>
                      </div>
                    </div>

                    {/* Conversation Area */}
                    <div
                      className="p-4 max-h-64 overflow-y-auto space-y-3"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(240, 253, 250, 0.5) 0%, rgba(239, 246, 255, 0.5) 100%)",
                      }}
                    >
                      {aiConversation.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            item.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-2.5 text-sm font-semibold ${
                              item.type === "user"
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                            style={{
                              whiteSpace: "pre-wrap",
                              borderRadius:
                                item.type === "user"
                                  ? "20px 20px 6px 20px"
                                  : "20px 20px 20px 6px",
                              background:
                                item.type === "user"
                                  ? "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                                  : "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
                              boxShadow:
                                item.type === "user"
                                  ? "0 4px 12px rgba(20, 184, 166, 0.3), inset 0 1px 2px rgba(255,255,255,0.2)"
                                  : "4px 4px 8px rgba(163, 177, 198, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.9), inset 1px 1px 2px rgba(255, 255, 255, 0.3)",
                              border:
                                item.type === "user"
                                  ? "none"
                                  : "2px solid rgba(226, 232, 240, 0.6)",
                            }}
                          >
                            {item.text}
                          </div>
                        </motion.div>
                      ))}
                      {isAILoading && (
                        <div className="flex justify-start">
                          <div
                            className="px-4 py-2.5 flex items-center gap-2"
                            style={{
                              borderRadius: "20px 20px 20px 6px",
                              background:
                                "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
                              boxShadow:
                                "4px 4px 8px rgba(163, 177, 198, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.9)",
                              border: "2px solid rgba(226, 232, 240, 0.6)",
                            }}
                          >
                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                            <span className="text-sm text-gray-500 font-semibold">
                              Thinking...
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={conversationEndRef} />
                    </div>

                    {/* Input Area */}
                    <div
                      className="p-4"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 250, 0.7) 100%)",
                        borderTop: "2px solid rgba(153, 246, 228, 0.3)",
                      }}
                    >
                      {generatedHMW ? (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleUseGeneratedHMW}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background:
                                "linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0891b2 100%)",
                              borderRadius: "16px",
                              boxShadow:
                                "0 6px 16px rgba(20, 184, 166, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
                            }}
                          >
                            <span>Use this challenge</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={resetAIBuilder}
                            className="px-5 py-3.5 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background:
                                "linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%)",
                              borderRadius: "16px",
                              border: "2px solid rgba(226, 232, 240, 0.8)",
                              boxShadow:
                                "4px 4px 8px rgba(163, 177, 198, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.9)",
                              color: "#4b5563",
                            }}
                          >
                            Try again
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleUserResponse();
                              }
                            }}
                            placeholder="Type or speak your answer..."
                            className="flex-1 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-200 transition-all text-sm font-semibold"
                            style={{
                              background:
                                "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
                              borderRadius: "14px",
                              border: "2px solid rgba(226, 232, 240, 0.8)",
                              boxShadow:
                                "inset 2px 2px 4px rgba(163, 177, 198, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.5)",
                            }}
                            disabled={isAILoading}
                          />
                          <button
                            type="button"
                            onClick={
                              isRecordingInput
                                ? stopVoiceInput
                                : startVoiceInput
                            }
                            disabled={isAILoading}
                            className="px-3.5 py-3 transition-all hover:scale-105 active:scale-95"
                            style={{
                              borderRadius: "14px",
                              background: isRecordingInput
                                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                : "linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)",
                              color: isRecordingInput ? "white" : "#4b5563",
                              boxShadow: isRecordingInput
                                ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                                : "3px 3px 6px rgba(163, 177, 198, 0.2), -3px -3px 6px rgba(255, 255, 255, 0.9)",
                            }}
                            title={
                              isRecordingInput
                                ? "Stop recording"
                                : "Voice input"
                            }
                          >
                            {isRecordingInput ? (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                              >
                                <Mic className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleUserResponse}
                            disabled={!userInput.trim() || isAILoading}
                            className="px-4 py-3 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                              borderRadius: "14px",
                              background:
                                "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                              boxShadow:
                                "0 4px 12px rgba(20, 184, 166, 0.3), inset 0 1px 2px rgba(255,255,255,0.2)",
                            }}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!showAIBuilder && (
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
            )}
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
