"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  MessageSquare,
  Star,
  Pencil,
  Mic,
  Image,
  Sparkles,
  ArrowRight,
  Check,
  Pin,
  Plus,
} from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

// Animated sticky note preview
function AnimatedStickyNote({ delay = 0 }: { delay?: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setStep((s) => (s < 4 ? s + 1 : s));
      }, 800);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      {/* Sticky note with badge */}
      <div className="relative inline-block">
        {/* Concept badge - positioned relative to sticky note */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 z-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-1.5 shadow-lg"
            >
              <Star className="w-4 h-4 text-white fill-current" />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="w-48 p-4 rounded-2xl border-3 border-yellow-400 bg-yellow-100 shadow-lg"
          style={{
            boxShadow:
              "8px 8px 16px rgba(251, 191, 36, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <motion.button
              animate={step >= 3 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`p-1.5 rounded-lg ${
                step >= 3
                  ? "text-yellow-600 bg-yellow-200"
                  : "text-gray-400 hover:bg-yellow-200/50"
              }`}
            >
              <Star className={`w-4 h-4 ${step >= 3 ? "fill-current" : ""}`} />
            </motion.button>
            <div className="flex gap-1">
              <motion.div
                animate={step >= 1 ? { scale: [0, 1.2, 1] } : { scale: 0 }}
                className="p-1.5 rounded-lg bg-yellow-200/50"
              >
                <Image className="w-3 h-3 text-gray-500" />
              </motion.div>
              <motion.div
                animate={step >= 2 ? { scale: [0, 1.2, 1] } : { scale: 0 }}
                className="p-1.5 rounded-lg bg-yellow-200/50"
              >
                <Pencil className="w-3 h-3 text-blue-500" />
              </motion.div>
            </div>
          </div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 0 ? 1 : 0 }}
            className="text-sm text-gray-800 font-bold"
          >
            {step >= 0 && "My creative idea..."}
          </motion.p>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-4 space-y-1">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: step >= 1 ? 1 : 0.3, x: step >= 1 ? 0 : -10 }}
          className="flex items-center gap-2 text-xs"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step >= 1 ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className={step >= 1 ? "text-gray-700" : "text-gray-400"}>
            Add images
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: step >= 2 ? 1 : 0.3, x: step >= 2 ? 0 : -10 }}
          className="flex items-center gap-2 text-xs"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step >= 2 ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className={step >= 2 ? "text-gray-700" : "text-gray-400"}>
            Sketch your ideas
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: step >= 3 ? 1 : 0.3, x: step >= 3 ? 0 : -10 }}
          className="flex items-center gap-2 text-xs"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              step >= 3 ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className={step >= 3 ? "text-gray-700" : "text-gray-400"}>
            Mark as concept ⭐
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Animated AI chat preview
function AnimatedAIChat({ delay = 0 }: { delay?: number }) {
  const [messages, setMessages] = useState<
    { text: string; isAI: boolean; visible: boolean }[]
  >([
    {
      text: "What assumptions are you making about your users?",
      isAI: true,
      visible: false,
    },
    {
      text: "I'm assuming they have some technical knowledge...",
      isAI: false,
      visible: false,
    },
    {
      text: "How might you verify that assumption? 🤔",
      isAI: true,
      visible: false,
    },
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      messages.forEach((_, index) => {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m, i) => (i === index ? { ...m, visible: true } : m))
          );
        }, index * 1200);
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className="space-y-3"
    >
      {messages.map((msg, index) => (
        <AnimatePresence key={index}>
          {msg.visible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`p-3 rounded-2xl ${
                msg.isAI
                  ? "bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 mr-8"
                  : "bg-gradient-to-br from-teal-50 to-green-50 border-2 border-teal-200 ml-8"
              }`}
            >
              {msg.isAI && (
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3" style={{ color: "#61ABC4" }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#61ABC4" }}
                  >
                    Volition
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-700 font-medium">{msg.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </motion.div>
  );
}

// Animated voice input preview
function AnimatedVoiceInput({ delay = 0 }: { delay?: number }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fullText = "A mobile app for tracking sustainability habits...";

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsRecording(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < fullText.length) {
          setTranscript(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsRecording(false);
          }, 500);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className="space-y-4"
    >
      {/* Mic button */}
      <div className="flex items-center justify-center">
        <motion.div
          animate={
            isRecording
              ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(239, 68, 68, 0.4)",
                    "0 0 0 20px rgba(239, 68, 68, 0)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          className={`p-4 rounded-2xl ${
            isRecording ? "bg-red-100 text-red-600" : "text-white"
          }`}
          style={isRecording ? {} : { backgroundColor: "#61ABC4" }}
        >
          <Mic className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Transcript */}
      <div className="text-center">
        <AnimatePresence>
          {isRecording && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-500 font-bold mb-2"
            >
              🎤 Listening...
            </motion.p>
          )}
        </AnimatePresence>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-3 min-h-[60px]">
          <p className="text-sm text-gray-700 font-medium">
            {transcript || (
              <span className="text-gray-400">Hold spacebar to speak...</span>
            )}
          </p>
        </div>
      </div>

      {/* Commands hint */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-700 mb-2">Voice Commands:</p>
        <div className="flex flex-wrap gap-2">
          {["save note", "next question", "mark as concept"].map((cmd) => (
            <span
              key={cmd}
              className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium"
            >
              "{cmd}"
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Animated workflow preview
function AnimatedWorkflow({ delay = 0 }: { delay?: number }) {
  const [activeStep, setActiveStep] = useState(-1);
  const steps = [
    { emoji: "💭", label: "Define HMW", color: "blue" },
    { emoji: "🎨", label: "Ideate", color: "teal" },
    { emoji: "⭐", label: "Select", color: "yellow" },
    { emoji: "✨", label: "Refine", color: "purple" },
    { emoji: "🚀", label: "Export", color: "green" },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setActiveStep((s) => (s < steps.length - 1 ? s + 1 : s));
      }, 600);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              animate={
                index <= activeStep
                  ? { scale: [0.8, 1.1, 1], opacity: 1 }
                  : { scale: 0.8, opacity: 0.4 }
              }
              transition={{ duration: 0.3 }}
              className={`flex flex-col items-center ${
                index === activeStep ? "scale-110" : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                  index <= activeStep
                    ? index === activeStep
                      ? "bg-gradient-to-br from-blue-400 to-teal-400 text-white shadow-lg ring-4 ring-blue-200"
                      : "bg-gradient-to-br from-green-100 to-green-200 text-green-600 shadow-md"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index < activeStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.emoji
                )}
              </div>
              <span
                className={`text-xs font-bold mt-1 ${
                  index <= activeStep
                    ? index === activeStep
                      ? "text-white"
                      : "text-green-600"
                    : "text-gray-400"
                }`}
                style={index === activeStep ? { color: "#61ABC4" } : {}}
              >
                {step.label}
              </span>
            </motion.div>
            {index < steps.length - 1 && (
              <motion.div
                animate={
                  index < activeStep
                    ? { scaleX: 1, opacity: 1 }
                    : { scaleX: 0, opacity: 0.3 }
                }
                transition={{ duration: 0.3 }}
                className="w-8 h-1 mx-1 bg-gradient-to-r from-green-300 to-green-400 rounded-full origin-left"
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const steps: Step[] = [
    {
      id: "welcome",
      title: "Welcome to Volition! 🎯",
      subtitle: "Your AI-powered design thinking companion",
      icon: <Lightbulb className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 font-medium text-center">
            Volition helps you explore design challenges through Socratic
            questioning—guiding you to deeper insights and stronger concepts.
          </p>
          <AnimatedWorkflow delay={500} />
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-4 border-2 border-blue-200">
            <p className="text-sm text-gray-700 font-semibold text-center">
              Start with a "How Might We" challenge, brainstorm ideas, and let
              the AI guide your exploration with thought-provoking questions.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sticky-notes",
      title: "Sticky Notes ✏️",
      subtitle: "Capture and organize your ideas",
      icon: <Pencil className="w-6 h-6" />,
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <AnimatedStickyNote delay={300} />
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">Features:</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Mark as Concept</strong> - Star your best ideas to
                  carry them forward
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Image className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Add Images</strong> - Attach reference images or
                  inspiration
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Pencil className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sketch Ideas</strong> - Draw directly on your notes
                </span>
              </li>
            </ul>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 mt-4">
              <p className="text-xs font-bold text-yellow-700">
                💡 Tip: Click on any note to edit its text!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-chat",
      title: "Volition Guide ✨",
      subtitle: "Thoughtful questions to deepen your thinking",
      icon: <MessageSquare className="w-6 h-6" />,
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <AnimatedAIChat delay={300} />
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">How it works:</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Ask Next Question</strong> - Get a new provocative
                  question based on your notes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Delve Deeper</strong> - Explore your most recent idea
                  further
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Mark Answered</strong> - Track which questions you've
                  explored
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Pin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Pin Questions</strong> - Keep important questions
                  visible at the top
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Plus className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Add to Canvas</strong> - Turn any question into a
                  sticky note
                </span>
              </li>
            </ul>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 mt-4">
              <p className="text-xs font-bold text-purple-700">
                🧠 The AI adapts its questions based on your notes and progress!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "voice",
      title: "Voice Input 🎤",
      subtitle: "Hands-free ideation with voice commands",
      icon: <Mic className="w-6 h-6" />,
      content: (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <AnimatedVoiceInput delay={300} />
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">Voice Features:</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                  Space
                </span>
                <span>Hold spacebar to speak (push-to-talk)</span>
              </li>
              <li className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Or hold the mic button in the toolbar</span>
              </li>
            </ul>
            <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-3">
              <p className="text-xs font-bold text-teal-700">
                🔊 The AI can speak back! Enable voice output to hear responses.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "canvas",
      title: "Infinite Canvas 🖼️",
      subtitle: "Navigate and organize with ease",
      icon: <Lightbulb className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 text-center">
              <span className="text-2xl mb-2 block">🖱️</span>
              <p className="text-xs font-bold text-blue-700">Pan & Zoom</p>
              <p className="text-xs text-blue-600 mt-1">
                Scroll to pan, Ctrl+scroll to zoom
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border-2 border-teal-200 text-center">
              <span className="text-2xl mb-2 block">📍</span>
              <p className="text-xs font-bold text-teal-700">Smart Alignment</p>
              <p className="text-xs text-teal-600 mt-1">
                Notes snap to guides when dragging
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 text-center">
              <span className="text-2xl mb-2 block">↩️</span>
              <p className="text-xs font-bold text-purple-700">Undo/Redo</p>
              <p className="text-xs text-purple-600 mt-1">Ctrl+Z / Ctrl+Y</p>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-3">
              ⌨️ Keyboard Shortcuts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl+Z
                </span>
                <span className="text-gray-600">Undo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl+Y
                </span>
                <span className="text-gray-600">Redo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl++/-
                </span>
                <span className="text-gray-600">Zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl+0
                </span>
                <span className="text-gray-600">Fit content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl+M
                </span>
                <span className="text-gray-600">Minimap</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
                  Ctrl+G
                </span>
                <span className="text-gray-600">Grid snap</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <span className="text-lg">💡</span>
              <span className="text-xs font-bold text-yellow-700">
                Tip: Double-click anywhere to create a note!
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "workflow",
      title: "Your Design Journey 🚀",
      subtitle: "From challenge to polished concepts",
      icon: <ArrowRight className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-2">
            {[
              {
                step: 1,
                title: "Define",
                desc: "Write your HMW challenge",
                emoji: "💭",
              },
              {
                step: 2,
                title: "Ideate",
                desc: "Create notes, answer questions",
                emoji: "🎨",
              },
              {
                step: 3,
                title: "Select",
                desc: "Pick your best concepts",
                emoji: "⭐",
              },
              {
                step: 4,
                title: "Refine",
                desc: "Add details to concepts",
                emoji: "✨",
              },
              {
                step: 5,
                title: "Export",
                desc: "Get AI evaluation & PDF",
                emoji: "🚀",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.step * 0.15 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-xl shadow-md">
                  {item.emoji}
                </div>
                <p className="text-xs font-bold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border-2 border-green-200">
            <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Ready to start?
            </h4>
            <p className="text-sm text-green-700">
              Begin by writing a "How Might We" statement—a challenge framed as
              an opportunity. For example: "How might we make morning commutes
              more enjoyable for busy professionals?"
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fun-card max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b-3 border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-gradient-to-br from-blue-400 to-teal-400 p-1.5 md:p-2 rounded-xl text-white">
                  {steps[currentStep].icon}
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-gray-800">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">
                    {steps[currentStep].subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {steps[currentStep].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 md:p-6 border-t-3 border-blue-100 bg-gradient-to-br from-gray-50 to-blue-50">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all touch-manipulation ${
                      index === currentStep
                        ? "bg-teal-500 w-5 md:w-6"
                        : index < currentStep
                        ? "bg-green-400"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:from-blue-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-teal transform hover:scale-105 touch-manipulation"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:from-green-600 hover:to-teal-600 transition-all shadow-lg transform hover:scale-105 touch-manipulation"
                  >
                    <span className="hidden sm:inline">Get</span> Started
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
