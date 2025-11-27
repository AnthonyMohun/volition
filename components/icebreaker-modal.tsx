"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Wind, MessageCircle, Lightbulb } from "lucide-react";

interface IcebreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUESTIONS = [
  "If you could have any superpower, what would it be and why?",
  "What's the weirdest food you've ever eaten?",
  "If you were a vegetable, what vegetable would you be?",
  "What's your favorite way to waste time?",
  "If you could teleport anywhere right now, where would you go?",
  "What's the best piece of advice you've ever received?",
  "If you had to listen to one song for the rest of your life, what would it be?",
  "What's a skill you'd love to learn but haven't yet?",
  "If you could meet any historical figure, who would it be?",
  "What's the funniest thing that happened to you recently?",
];

const FUN_FACTS = [
  "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible.",
  "Cows have best friends and get stressed when they are separated.",
  "Bananas are curved because they grow towards the sun.",
  "Octopuses have three hearts.",
  "A group of flamingos is called a 'flamboyance'.",
  "The shortest war in history lasted 38 minutes.",
  "Wombat poop is cube-shaped.",
  "Sloths can hold their breath longer than dolphins can.",
  "There are more stars in the universe than grains of sand on all the Earth's beaches.",
  "A cloud can weigh more than a million pounds.",
];

type Activity = "question" | "breathing" | "fact";

export function IcebreakerModal({ isOpen, onClose }: IcebreakerModalProps) {
  const [activeTab, setActiveTab] = useState<Activity>("question");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentFact, setCurrentFact] = useState("");
  const [breathingState, setBreathingState] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingText, setBreathingText] = useState("Breathe In");

  useEffect(() => {
    if (isOpen) {
      handleRandomQuestion();
      handleRandomFact();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "breathing" && isOpen) {
      const breathe = () => {
        setBreathingState("inhale");
        setBreathingText("Breathe In...");
        
        setTimeout(() => {
          setBreathingState("hold");
          setBreathingText("Hold...");
          
          setTimeout(() => {
            setBreathingState("exhale");
            setBreathingText("Breathe Out...");
          }, 2000); // Hold for 2s
        }, 4000); // Inhale for 4s
      };

      breathe();
      interval = setInterval(breathe, 10000); // Total cycle 10s (4+2+4)
    }
    return () => clearInterval(interval);
  }, [activeTab, isOpen]);

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    setCurrentQuestion(QUESTIONS[randomIndex]);
  };

  const handleRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * FUN_FACTS.length);
    setCurrentFact(FUN_FACTS[randomIndex]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-cyan-900/30 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-2">
                <span className="text-4xl">🧊</span> Icebreaker
              </h2>
              <p className="text-cyan-100 font-medium mt-1">Chill out and get ready to create!</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("question")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "question" 
                ? "bg-white text-cyan-600 shadow-sm" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Question
          </button>
          <button
            onClick={() => setActiveTab("breathing")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "breathing" 
                ? "bg-white text-teal-600 shadow-sm" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Wind className="w-4 h-4" /> Breathe
          </button>
          <button
            onClick={() => setActiveTab("fact")}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "fact" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Lightbulb className="w-4 h-4" /> Fun Fact
          </button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
          
          {activeTab === "question" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
              <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100 mb-6 relative">
                <div className="text-6xl absolute -top-6 -left-4 opacity-20 rotate-12">❓</div>
                <p className="text-xl font-bold text-gray-800 leading-relaxed relative z-10">
                  {currentQuestion}
                </p>
              </div>
              <button
                onClick={handleRandomQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-cyan-200"
              >
                <RefreshCw className="w-5 h-5" />
                New Question
              </button>
            </div>
          )}

          {activeTab === "breathing" && (
            <div className="animate-in fade-in duration-500 flex flex-col items-center w-full">
              <div className="relative mb-8">
                {/* Outer glow */}
                <div 
                  className={`absolute inset-0 bg-teal-400/30 rounded-full blur-xl transition-all duration-[4000ms] ease-in-out ${
                    breathingState === "inhale" ? "scale-150 opacity-100" : 
                    breathingState === "hold" ? "scale-150 opacity-80" : "scale-100 opacity-50"
                  }`}
                ></div>
                
                {/* Circle */}
                <div 
                  className={`w-48 h-48 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl relative z-10 transition-all duration-[4000ms] ease-in-out ${
                     breathingState === "inhale" ? "scale-110" : 
                     breathingState === "hold" ? "scale-110" : "scale-90"
                  }`}
                >
                  <span className="animate-pulse">{breathingText}</span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">
                Follow the rhythm to relax your mind
              </p>
            </div>
          )}

          {activeTab === "fact" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6 relative">
                <div className="text-6xl absolute -top-6 -right-4 opacity-20 -rotate-12">💡</div>
                <p className="text-xl font-bold text-gray-800 leading-relaxed relative z-10">
                  {currentFact}
                </p>
              </div>
              <button
                onClick={handleRandomFact}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-200"
              >
                <RefreshCw className="w-5 h-5" />
                Another Fact
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
