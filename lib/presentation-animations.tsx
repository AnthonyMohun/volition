"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Pencil,
  Mic,
  Image,
  Sparkles,
  Check,
  MessageSquare,
  Lightbulb,
  Users,
  Zap,
  Target,
  Brain,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

// ============================================
// STATIC STICKY NOTE (uses global CSS)
// ============================================
export function AnimatedStickyNote({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex flex-col items-center w-[300px]">
      {/* Sticky note with badge */}
      <div className="relative inline-block">
        {/* Concept badge */}
        <div className="pres-anim-badge absolute -top-3 -right-3 z-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-2 shadow-lg">
          <Star className="w-5 h-5 text-white fill-current" />
        </div>

        <div
          className="w-72 p-6 rounded-3xl border-4 border-yellow-400 bg-yellow-100"
          style={{
            boxShadow:
              "12px 12px 24px rgba(251, 191, 36, 0.4), -4px -4px 12px rgba(255, 255, 255, 0.6)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button className="p-2 rounded-xl text-yellow-600 bg-yellow-200">
              <Star className="w-5 h-5 fill-current" />
            </button>
            <div className="flex gap-2">
              <div className="pres-anim-icon-1 p-2 rounded-xl bg-yellow-200/50">
                <Image className="w-4 h-4 text-gray-500" />
              </div>
              <div className="pres-anim-icon-2 p-2 rounded-xl bg-yellow-200/50">
                <Pencil className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Text */}
          <p className="text-lg text-gray-800 font-bold">My creative idea...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STATIC AI CHAT (uses global CSS)
// ============================================
export function AnimatedAIChat({ delay = 0 }: { delay?: number }) {
  return (
    <div className="space-y-6 w-[420px]">
      {/* Message 1 - AI */}
      <div className="pres-anim-msg-1 p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 mr-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-teal-500" />
          <span className="text-base font-bold text-teal-600">Volition</span>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          What assumptions are you making about your users?
        </p>
      </div>

      {/* Message 2 - User */}
      <div className="pres-anim-msg-2 p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-green-50 border-2 border-teal-200 ml-8">
        <p className="text-lg text-gray-700 font-medium">
          I'm assuming they have some technical knowledge...
        </p>
      </div>

      {/* Message 3 - AI */}
      <div className="pres-anim-msg-3 p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 mr-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-teal-500" />
          <span className="text-base font-bold text-teal-600">Volition</span>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          How might you verify that assumption? 🤔
        </p>
      </div>
    </div>
  );
}

// ============================================
// STATIC VOICE INPUT (uses global CSS)
// ============================================
export function AnimatedVoiceInput({ delay = 0 }: { delay?: number }) {
  return (
    <div className="space-y-6 w-[320px]">
      {/* Mic button */}
      <div className="flex items-center justify-center">
        <div className="pres-anim-mic p-6 rounded-3xl bg-red-100 text-red-600">
          <Mic className="w-12 h-12" />
        </div>
      </div>

      {/* Transcript */}
      <div className="text-center">
        <p className="text-base text-red-500 font-bold mb-3">🎤 Listening...</p>
        <div className="bg-white border-3 border-gray-200 rounded-2xl p-5 min-h-[100px]">
          <p className="text-lg text-gray-700 font-medium pres-anim-typing">
            A mobile app for tracking sustainability habits...
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ANIMATED WORKFLOW
// ============================================
export function AnimatedWorkflow({
  delay = 0,
  size = "large",
}: {
  delay?: number;
  size?: "small" | "large";
}) {
  const [activeStep, setActiveStep] = useState(-1);
  const steps = [
    { emoji: "💭", label: "Define", color: "blue" },
    { emoji: "🎨", label: "Ideate", color: "teal" },
    { emoji: "⭐", label: "Select", color: "yellow" },
    { emoji: "✨", label: "Refine", color: "purple" },
    { emoji: "🚀", label: "Export", color: "green" },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setActiveStep((s) => (s < steps.length - 1 ? s + 1 : -1)); // Loop
      }, 800);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const iconSize = size === "large" ? "w-16 h-16" : "w-12 h-12";
  const textSize = size === "large" ? "text-base" : "text-sm";
  const emojiSize = size === "large" ? "text-2xl" : "text-xl";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              animate={
                index <= activeStep
                  ? { scale: [0.8, 1.1, 1], opacity: 1 }
                  : { scale: 0.8, opacity: 0.4 }
              }
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div
                className={`${iconSize} rounded-2xl flex items-center justify-center ${emojiSize} transition-all ${
                  index <= activeStep
                    ? index === activeStep
                      ? "bg-gradient-to-br from-blue-400 to-teal-400 text-white shadow-lg ring-4 ring-blue-200"
                      : "bg-gradient-to-br from-green-100 to-green-200 text-green-600 shadow-md"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index < activeStep ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.emoji
                )}
              </div>
              <span
                className={`${textSize} font-bold mt-2 ${
                  index <= activeStep
                    ? index === activeStep
                      ? "text-teal-700"
                      : "text-green-600"
                    : "text-gray-400"
                }`}
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
                className="w-12 h-1.5 mx-2 bg-gradient-to-r from-green-300 to-green-400 rounded-full origin-left"
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// ANIMATED COMPARISON CARDS
// ============================================
interface ComparisonItem {
  label: string;
  volition: boolean | string;
  others: boolean | string;
}

export function AnimatedComparisonCard({ delay = 0 }: { delay?: number }) {
  const [visibleIndex, setVisibleIndex] = useState(-1);

  const comparisons: ComparisonItem[] = [
    { label: "Socratic AI Guidance", volition: true, others: false },
    { label: "Voice-First Input", volition: true, others: false },
    { label: "Local-First Privacy", volition: true, others: false },
    { label: "Design Education Focus", volition: true, others: false },
    { label: "Stuck Detection", volition: true, others: false },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleIndex((i) => (i < comparisons.length - 1 ? i + 1 : -1));
      }, 1000);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <span className="text-sm font-bold text-gray-500">Feature</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-black text-teal-600">Volition</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-gray-400">Others</span>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-3">
        {comparisons.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: index <= visibleIndex ? 1 : 0.3,
              x: index <= visibleIndex ? 0 : -20,
            }}
            className="grid grid-cols-3 gap-4 items-center p-3 rounded-2xl bg-white/50"
          >
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <div className="flex justify-center">
              <motion.div
                animate={index <= visibleIndex ? { scale: [0, 1.2, 1] } : {}}
                className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-green-600" />
              </motion.div>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">—</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// ANIMATED PROCESS DIAGRAM
// ============================================
export function AnimatedProcessDiagram({ delay = 0 }: { delay?: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setStep((s) => (s < 4 ? s + 1 : 0));
      }, 1500);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className="grid grid-cols-2 gap-12"
    >
      {/* Traditional Process */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-gray-400 text-center mb-6">
          Traditional
        </h3>
        <div className="flex flex-col items-center space-y-3">
          {["Research", "Define", "Ideate", "Prototype", "Test"].map(
            (label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 font-bold">{i + 1}</span>
                </div>
                <span className="text-gray-500 font-medium w-24">{label}</span>
                {i < 4 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 rotate-90 absolute -bottom-4 left-1/2 -translate-x-1/2" />
                )}
              </div>
            )
          )}
        </div>
        <p className="text-sm text-gray-400 text-center mt-4">
          Linear, step-by-step
        </p>
      </div>

      {/* Socratic Process */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-teal-600 text-center mb-6">
          Socratic
        </h3>
        <div className="relative">
          {/* Central question */}
          <motion.div
            animate={{ scale: step === 0 ? [1, 1.1, 1] : 1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center mx-auto mb-4"
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </motion.div>

          {/* Exploration branches */}
          <div className="flex justify-center gap-4">
            {[Lightbulb, Brain, Target].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: step === i + 1 ? [1, 1.2, 1] : 1,
                  opacity: step >= i + 1 ? 1 : 0.4,
                }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-green-100 flex items-center justify-center"
              >
                <Icon className="w-6 h-6 text-teal-600" />
              </motion.div>
            ))}
          </div>

          {/* Deeper exploration */}
          <motion.div
            animate={{ opacity: step >= 4 ? 1 : 0.3, y: step >= 4 ? 0 : 10 }}
            className="flex justify-center gap-2 mt-4"
          >
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </motion.div>
        </div>
        <p className="text-sm text-teal-600 text-center mt-4">
          Guided exploration
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// ANIMATED SUCCESS JOURNEY
// ============================================
export function AnimatedSuccessJourney({ delay = 0 }: { delay?: number }) {
  const [step, setStep] = useState(0);

  const stages = [
    { icon: Target, label: "Challenge", color: "blue" },
    { icon: Lightbulb, label: "Ideas", color: "yellow" },
    { icon: Star, label: "Concepts", color: "teal" },
    { icon: Sparkles, label: "Refined", color: "purple" },
    { icon: Check, label: "Success!", color: "green" },
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setStep((s) => (s < stages.length - 1 ? s + 1 : 0));
      }, 1200);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
      className="flex items-center justify-center gap-4"
    >
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isActive = index <= step;
        const isCurrent = index === step;

        return (
          <div key={stage.label} className="flex items-center">
            <motion.div
              animate={{
                scale: isCurrent ? [1, 1.15, 1] : 1,
                opacity: isActive ? 1 : 0.4,
              }}
              className="flex flex-col items-center"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? isCurrent
                      ? "bg-gradient-to-br from-teal-400 to-blue-500 shadow-lg"
                      : "bg-gradient-to-br from-green-100 to-green-200"
                    : "bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-8 h-8 ${
                    isActive
                      ? isCurrent
                        ? "text-white"
                        : "text-green-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-bold mt-2 ${
                  isActive
                    ? isCurrent
                      ? "text-teal-600"
                      : "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
            {index < stages.length - 1 && (
              <motion.div
                animate={{
                  scaleX: index < step ? 1 : 0,
                  opacity: index < step ? 1 : 0.3,
                }}
                className="w-8 h-1 mx-2 bg-gradient-to-r from-green-400 to-teal-400 rounded-full origin-left"
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

// ============================================
// FLOATING EMOJI DECORATION
// ============================================
export function FloatingEmoji({
  emoji,
  className = "",
  delay = 0,
}: {
  emoji: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { delay: delay / 1000, duration: 0.3 },
        scale: { delay: delay / 1000, duration: 0.3 },
        y: {
          delay: delay / 1000 + 0.3,
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      className={`text-4xl ${className}`}
    >
      {emoji}
    </motion.span>
  );
}

// ============================================
// PERSONA CARD
// ============================================
export function PersonaCard({
  emoji,
  title,
  description,
  delay = 0,
}: {
  emoji: string;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, type: "spring", damping: 20 }}
      className="fun-card p-8 text-center"
    >
      <span className="text-6xl mb-4 block">{emoji}</span>
      <h3 className="text-2xl font-black text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 font-medium">{description}</p>
    </motion.div>
  );
}
