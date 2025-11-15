"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "@/components/hmw-helper-modal";
import { EXAMPLE_SESSION_DATA } from "@/lib/example-data";
import {
  Lightbulb,
  Sparkles,
  HelpCircle,
  PlayCircle,
  Info,
} from "lucide-react";

const EXAMPLE_HMWS = [
  "How might we help students manage their time more effectively?",
  "How might we help people with hearing impairments access our mobile app when they can't receive audio notifications?",
  "How might we help busy professionals accomplish managing emails so they can spend less than 10 minutes per day?",
  "How might we help remote team members feel more like a team around same projects or interests?",
  "How might we help online shoppers reduce single-use packaging by using reusable packaging?",
];

export default function Home() {
  const router = useRouter();
  const { updateHMW, setPhase, loadExampleSession } = useSession();
  const [hmwInput, setHmwInput] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hmwInput.trim()) {
      updateHMW(hmwInput.trim());
      setPhase("canvas");
      router.push("/canvas");
    }
  };

  const handleSelectTemplate = (template: string) => {
    setHmwInput(template);
    setShowHelper(false);
  };

  const handleRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_HMWS.length);
    setHmwInput(EXAMPLE_HMWS[randomIndex]);
  };

  const handleTryExample = () => {
    loadExampleSession(EXAMPLE_SESSION_DATA);
    router.push("/canvas");
  };

  return (
    <div className="min-h-screen dark-gradient-radial texture-overlay flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Lightbulb className="w-10 h-10 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Socratic Design Studio
            </h1>
          </div>
          <p className="text-gray-400 text-lg mb-2">
            Discover concepts through guided exploration
          </p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl p-8 border border-gray-700/50 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="hmw"
                  className="text-sm font-medium text-gray-300"
                >
                  Your Design Challenge
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelper(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                  title="Browse example HMW statements"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Examples</span>
                </button>
              </div>
              <div className="relative">
                <textarea
                  id="hmw"
                  value={hmwInput}
                  onChange={(e) => setHmwInput(e.target.value)}
                  placeholder="Frame your challenge as a 'How Might We' statement to begin..."
                  className="w-full px-4 py-4 pr-12 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-100 placeholder:text-gray-500 transition-all text-base"
                  rows={3}
                  required
                />
                <button
                  type="button"
                  onClick={handleRandomExample}
                  className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-300 transition-colors p-1 hover:bg-gray-700/50 rounded"
                  title="Try a random example"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={!hmwInput.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 hover:shadow-xl silver-glow"
              >
                Begin Exploration
              </button>

              <button
                type="button"
                onClick={handleTryExample}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg hover:shadow-emerald-500/50 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Try Example
              </button>
            </div>
          </form>
        </div>

        {/* How it works - Simplified */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" />
            How it works
          </button>
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-8 border border-gray-700/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-100">How It Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="glass-light rounded-lg p-6 mb-4">
                  <Lightbulb className="w-12 h-12 text-purple-400 mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-100 mb-2">Ideate</h3>
                <p className="text-sm text-gray-400">
                  Answer guided questions with sticky notes and attach images
                  for richer ideas
                </p>
              </div>
              <div className="text-center">
                <div className="glass-light rounded-lg p-6 mb-4">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-100 mb-2">Refine</h3>
                <p className="text-sm text-gray-400">
                  Mark promising ideas as concepts and self-evaluate your top
                  ones
                </p>
              </div>
              <div className="text-center">
                <div className="glass-light rounded-lg p-6 mb-4">
                  <HelpCircle className="w-12 h-12 text-purple-400 mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-100 mb-2">Feedback</h3>
                <p className="text-sm text-gray-400">
                  Get AI insights on your final designs
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <HMWHelperModal
        isOpen={showHelper}
        onClose={() => setShowHelper(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
