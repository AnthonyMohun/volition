"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "@/components/hmw-helper-modal";
import { EXAMPLE_SESSION_DATA } from "@/lib/example-data";
import { Lightbulb, Sparkles, HelpCircle, PlayCircle } from "lucide-react";

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
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lightbulb className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Socratic Design Studio
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Discover concepts through guided exploration
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-gray-700/50">
          <div className="flex items-start gap-3 mb-6 p-4 glass-light rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-100 mb-1">
                Start with a "How Might We" statement
              </h2>
              <p className="text-sm text-gray-400">
                Frame your design challenge as an open-ended question. This
                helps focus your ideation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="hmw"
                  className="block text-sm font-medium text-gray-300"
                >
                  Your Design Challenge
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHelper(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                    title="Get help formulating your statement"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Need help?</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomExample}
                    className="text-2xl hover:scale-110 transition-transform"
                    title="Try a random example"
                  >
                    🎲
                  </button>
                </div>
              </div>
              <textarea
                id="hmw"
                value={hmwInput}
                onChange={(e) => setHmwInput(e.target.value)}
                placeholder="How might we help students manage their time more effectively?"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-100 placeholder:text-gray-500 transition-all"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!hmwInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 hover:shadow-xl silver-glow"
            >
              Begin Exploration
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0a] text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTryExample}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg hover:shadow-emerald-500/50 hover:shadow-xl flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Try with an Example
            </button>
          </form>

          <div className="mt-6 p-4 glass-light rounded-lg border border-gray-700/50">
            <h3 className="font-medium text-gray-200 mb-4 text-sm text-center">
              How it works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 glass-light rounded-lg border border-gray-700/30">
                <Lightbulb className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-100 mb-1 text-sm">
                  Ideate
                </h4>
                <p className="text-xs text-gray-400">
                  Answer guided questions with sticky notes and attach images
                  for richer ideas
                </p>
              </div>
              <div className="text-center p-4 glass-light rounded-lg border border-gray-700/30">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-100 mb-1 text-sm">
                  Refine
                </h4>
                <p className="text-xs text-gray-400">
                  Mark promising ideas as concepts and self-evaluate your top
                  ones
                </p>
              </div>
              <div className="text-center p-4 glass-light rounded-lg border border-gray-700/30">
                <HelpCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-100 mb-1 text-sm">
                  Feedback
                </h4>
                <p className="text-xs text-gray-400">
                  Get AI insights on your final designs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HMWHelperModal
        isOpen={showHelper}
        onClose={() => setShowHelper(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
