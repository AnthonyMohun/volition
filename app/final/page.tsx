"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { askAI } from "@/lib/ai-client";
import {
  SELF_EVAL_CRITERIA,
  type ConceptSelfEvaluation,
  type StickyNote,
} from "@/lib/types";
import {
  ListRestart,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Trophy,
  Star,
  Lightbulb,
  RefreshCw,
  Loader2,
} from "lucide-react";

// Emoji reactions for different score levels
const SCORE_REACTIONS = [
  ["😬", "Hmm..."],
  ["🤔", "Getting there"],
  ["😊", "Nice!"],
  ["🎉", "Great!"],
  ["🚀", "Amazing!"],
];

export default function FinalPage() {
  const router = useRouter();
  const { state, resetSession } = useSession();

  // Which concept we're evaluating (0, 1, 2)
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  // Which criteria within current concept (0-4)
  const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
  // All evaluations
  const [evaluations, setEvaluations] = useState<ConceptSelfEvaluation[]>([]);
  // Current rating being set
  const [currentRating, setCurrentRating] = useState<number>(0);
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // Final summary view
  const [showSummary, setShowSummary] = useState(false);
  // AI synthesis
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const conceptNotes = state.notes.filter((n) => n.isConcept);
  const selectedNotes = state.selectedConceptIds
    .map((id) => conceptNotes.find((n) => n.id === id))
    .filter((n): n is StickyNote => n !== undefined);

  const currentConcept = selectedNotes[currentConceptIndex];
  const currentCriteria = SELF_EVAL_CRITERIA[currentCriteriaIndex];
  const totalSteps = selectedNotes.length * SELF_EVAL_CRITERIA.length;
  const currentStep =
    currentConceptIndex * SELF_EVAL_CRITERIA.length + currentCriteriaIndex + 1;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!state.hmwStatement || selectedNotes.length < 3) {
      router.push("/canvas");
    }
  }, [state.hmwStatement, selectedNotes.length, router]);

  // Initialize evaluations
  useEffect(() => {
    if (selectedNotes.length > 0 && evaluations.length === 0) {
      setEvaluations(
        selectedNotes.map((note) => ({
          conceptId: note.id,
          ratings: [],
        }))
      );
    }
  }, [selectedNotes, evaluations.length]);

  // Generate AI insight when summary is shown
  const generateInsight = async (rankedConcepts: Array<{
    note: StickyNote;
    score: number;
    ratings: Array<{ criteriaId: string; score: number }>;
  }>) => {
    setIsLoadingInsight(true);
    
    try {
      // Build a summary of ratings for the AI
      const conceptSummaries = rankedConcepts.map((item, idx) => {
        const criteriaBreakdown = SELF_EVAL_CRITERIA.map(c => {
          const rating = item.ratings.find(r => r.criteriaId === c.id);
          return `${c.label}: ${rating?.score || 0}/5`;
        }).join(", ");
        
        return `#${idx + 1} "${item.note.text}" (Score: ${item.score}/100)
  Ratings: ${criteriaBreakdown}`;
      }).join("\n\n");

      // Find interesting patterns
      const topConcept = rankedConcepts[0];
      const lowestCriteria = SELF_EVAL_CRITERIA.reduce((lowest, c) => {
        const rating = topConcept.ratings.find(r => r.criteriaId === c.id);
        const lowestRating = topConcept.ratings.find(r => r.criteriaId === lowest.id);
        return (rating?.score || 0) < (lowestRating?.score || 0) ? c : lowest;
      }, SELF_EVAL_CRITERIA[0]);

      const prompt = `You are a design thinking coach analyzing a student's self-evaluation of their concepts.

Design Challenge: "${state.hmwStatement}"

Their Self-Ratings:
${conceptSummaries}

Based on their self-ratings, provide ONE short, actionable insight (2-3 sentences max). Focus on:
- If there's a gap between high excitement but low doability, mention it
- If all concepts scored low on one criteria, suggest focusing there
- If the top concept has a weak spot, recommend addressing it early
- If ratings seem very similar, suggest what might differentiate them

Be direct, specific, and helpful. No fluff. Start with an emoji. Don't repeat what they can already see in the scores.`;

      const response = await askAI(
        [
          {
            role: "system",
            content: "You are a concise design coach. Give one specific, actionable insight based on the student's self-ratings. Be direct and helpful, not generic. Max 2-3 sentences.",
          },
          { role: "user", content: prompt },
        ],
        0.7,
        150
      );

      setAiInsight(response.trim());
    } catch (error) {
      // Fallback insight based on data
      const topConcept = rankedConcepts[0];
      const bottomConcept = rankedConcepts[rankedConcepts.length - 1];
      const scoreDiff = topConcept.score - bottomConcept.score;
      
      if (scoreDiff < 15) {
        setAiInsight("🤔 Your concepts are rated quite similarly. Consider which one you'd be most excited to work on for the next few weeks—that passion often makes the difference.");
      } else {
        const weakSpot = SELF_EVAL_CRITERIA.reduce((lowest, c) => {
          const rating = topConcept.ratings.find(r => r.criteriaId === c.id);
          const lowestRating = topConcept.ratings.find(r => r.criteriaId === lowest.id);
          return (rating?.score || 0) < (lowestRating?.score || 0) ? c : lowest;
        }, SELF_EVAL_CRITERIA[0]);
        
        setAiInsight(`💡 Your top concept scored lower on ${weakSpot.label}. Before moving forward, spend some time strengthening that area—it'll make your concept more well-rounded.`);
      }
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Handle rating selection - just set the score, no AI call
  const handleRatingSelect = (score: number) => {
    setCurrentRating(score);
  };

  // Save rating and move to next
  const handleNext = () => {
    if (currentRating === 0) return;

    // Save the rating
    const newEvaluations = [...evaluations];
    const conceptEval = newEvaluations[currentConceptIndex];
    if (conceptEval) {
      conceptEval.ratings = [
        ...conceptEval.ratings.filter(
          (r) => r.criteriaId !== currentCriteria.id
        ),
        { criteriaId: currentCriteria.id, score: currentRating },
      ];
    }
    setEvaluations(newEvaluations);

    setIsTransitioning(true);

    setTimeout(() => {
      // Move to next criteria or concept
      if (currentCriteriaIndex < SELF_EVAL_CRITERIA.length - 1) {
        setCurrentCriteriaIndex((prev) => prev + 1);
      } else if (currentConceptIndex < selectedNotes.length - 1) {
        // Finished concept, show mini celebration
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setCurrentConceptIndex((prev) => prev + 1);
          setCurrentCriteriaIndex(0);
        }, 1200);
      } else {
        // All done! Calculate rankings and get AI insight
        const ranked = selectedNotes
          .map((note, idx) => ({
            note,
            score: calculateConceptScore(idx, newEvaluations),
            ratings: newEvaluations[idx]?.ratings || [],
          }))
          .sort((a, b) => b.score - a.score);
        
        generateInsight(ranked);
        setShowSummary(true);
      }

      setCurrentRating(0);
      setIsTransitioning(false);
    }, 250);
  };

  const handleStartOver = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      resetSession();
      router.push("/");
    }
  };

  const calculateConceptScore = (conceptIndex: number, evals: ConceptSelfEvaluation[] = evaluations) => {
    const conceptEval = evals[conceptIndex];
    if (!conceptEval || conceptEval.ratings.length === 0) return 0;
    const total = conceptEval.ratings.reduce((sum, r) => sum + r.score, 0);
    return Math.round((total / conceptEval.ratings.length) * 20); // Convert to 0-100
  };

  if (!state.hmwStatement || selectedNotes.length < 3) {
    return null;
  }

  // Summary View
  if (showSummary) {
    const rankedConcepts = selectedNotes
      .map((note, idx) => ({
        note,
        score: calculateConceptScore(idx),
        ratings: evaluations[idx]?.ratings || [],
      }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen fun-gradient-bg p-6 relative overflow-hidden">
        {/* Celebration confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-20px",
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              {
                ["🎉", "⭐", "✨", "🌟", "💜", "🚀"][
                  Math.floor(Math.random() * 6)
                ]
              }
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-200 to-orange-200 mb-4 shadow-lg animate-bounce">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-800 mb-3">
              🎊 Your Self-Assessment
            </h1>
            <p className="text-lg text-gray-600 font-semibold">
              Here&apos;s how you rated your concepts
            </p>
          </div>

          {/* Ranked Concepts */}
          <div className="space-y-6 mb-8">
            {rankedConcepts.map((item, idx) => (
              <div
                key={item.note.id}
                className={`fun-card p-6 border-3 transition-all ${
                  idx === 0
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50"
                    : "border-purple-200"
                }`}
              >
                <div className="flex items-start gap-5">
                  {/* Rank Badge */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                      idx === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white"
                        : idx === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                        : "bg-gradient-to-br from-orange-300 to-orange-400 text-white"
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Concept Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {idx === 0 && <span className="text-2xl">👑</span>}
                      <h3 className="text-xl font-black text-gray-800 truncate">
                        {item.note.text}
                      </h3>
                    </div>

                    {/* Mini Criteria Bars */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {SELF_EVAL_CRITERIA.map((criteria) => {
                        const rating = item.ratings.find(
                          (r) => r.criteriaId === criteria.id
                        );
                        return (
                          <div
                            key={criteria.id}
                            className="flex items-center gap-2"
                          >
                            <span className="text-lg">{criteria.emoji}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    rating && star <= rating.score
                                      ? "fill-current"
                                      : "text-gray-300"
                                  }`}
                                  style={{
                                    color:
                                      rating && star <= rating.score
                                        ? criteria.color
                                        : undefined,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score Circle */}
                  <div className="flex-shrink-0 text-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg ${
                        item.score >= 80
                          ? "bg-gradient-to-br from-green-400 to-emerald-500"
                          : item.score >= 60
                          ? "bg-gradient-to-br from-blue-400 to-purple-500"
                          : "bg-gradient-to-br from-orange-400 to-pink-500"
                      }`}
                    >
                      {item.score}
                    </div>
                    <p className="text-xs text-gray-500 font-bold mt-1">/100</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight Card */}
          <div className="fun-card p-6 border-3 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
                {isLoadingInsight ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Lightbulb className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-800 mb-2">
                  🤖 AI Insight
                </h3>
                {isLoadingInsight ? (
                  <p className="text-gray-500 font-semibold">Analyzing your ratings...</p>
                ) : aiInsight ? (
                  <p className="text-gray-700 font-semibold leading-relaxed">
                    {aiInsight}
                  </p>
                ) : (
                  <p className="text-gray-600 font-semibold leading-relaxed">
                    Your top-rated concept is{" "}
                    <span className="text-purple-600 font-black">
                      &quot;{rankedConcepts[0]?.note.text}&quot;
                    </span>
                    . Trust your instincts—you know your design challenge best!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setShowSummary(false);
                setCurrentConceptIndex(0);
                setCurrentCriteriaIndex(0);
                setAiInsight(null);
                setEvaluations(
                  selectedNotes.map((note) => ({
                    conceptId: note.id,
                    ratings: [],
                  }))
                );
              }}
              className="fun-button-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Re-evaluate
            </button>
            <button
              onClick={handleStartOver}
              className="fun-button-primary flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start New Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mini Celebration between concepts
  if (showCelebration) {
    return (
      <div className="min-h-screen fun-gradient-bg flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">
            Concept {currentConceptIndex + 1} Complete!
          </h2>
          <p className="text-lg text-gray-600 font-semibold">
            {selectedNotes.length - currentConceptIndex - 1} more to go...
          </p>
        </div>
      </div>
    );
  }

  // Main Evaluation Interface - Clean and fast, no AI interruptions
  return (
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 text-6xl float-animation">
          ⭐
        </div>
        <div
          className="absolute top-40 right-20 text-5xl float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-5xl float-animation"
          style={{ animationDelay: "2s" }}
        >
          ✨
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white to-purple-50/50 border-b-3 border-purple-200 px-6 py-4 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/refine")}
              className="p-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
              title="Back to refine"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>
            <button
              onClick={handleStartOver}
              className="p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
              title="Start new project"
            >
              <ListRestart className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                Rate Your Concepts
              </h1>
              <p className="text-sm text-gray-600 font-bold">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs mx-8">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Concept indicator */}
          <div className="flex gap-2">
            {selectedNotes.map((_, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                  idx === currentConceptIndex
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110 shadow-lg"
                    : idx < currentConceptIndex
                    ? "bg-green-400 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {idx < currentConceptIndex ? "✓" : idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Current Concept Card */}
          <div
            className={`fun-card p-6 border-3 border-purple-200 mb-8 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-x-8"
                : "opacity-100 translate-x-0"
            }`}
          >
            <div className="flex items-start gap-4">
              {currentConcept?.image && (
                <img
                  src={currentConcept.image.dataUrl}
                  alt="Concept"
                  className="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-purple-600 uppercase tracking-wide mb-1">
                  Concept {currentConceptIndex + 1}
                </p>
                <h2 className="text-xl font-black text-gray-800 mb-2 leading-tight">
                  {currentConcept?.text}
                </h2>
                {currentConcept?.details && (
                  <p className="text-sm text-gray-600 font-semibold line-clamp-2">
                    {currentConcept.details.split("\n")[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div
            className={`fun-card p-8 border-3 mb-6 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 -translate-x-8"
                : "opacity-100 translate-x-0"
            }`}
            style={{ borderColor: currentCriteria?.color }}
          >
            {/* Criteria Header */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
                style={{ backgroundColor: `${currentCriteria?.color}20` }}
              >
                <span className="text-4xl">{currentCriteria?.emoji}</span>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">
                {currentCriteria?.label}
              </h3>
              <p className="text-gray-600 font-semibold">
                {currentCriteria?.description}
              </p>
            </div>

            {/* Rating Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleRatingSelect(score)}
                  className={`group relative w-16 h-16 rounded-2xl font-black text-xl transition-all duration-200 ${
                    currentRating === score
                      ? "scale-125 shadow-xl"
                      : "hover:scale-110 hover:shadow-lg"
                  }`}
                  style={{
                    backgroundColor:
                      currentRating === score
                        ? currentCriteria?.color
                        : currentRating >= score
                        ? `${currentCriteria?.color}60`
                        : "#f3f4f6",
                    color: currentRating >= score ? "white" : "#6b7280",
                  }}
                >
                  {score}
                  {currentRating === score && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      {SCORE_REACTIONS[score - 1][0]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between text-sm text-gray-500 font-bold px-2">
              <span>{currentCriteria?.lowLabel}</span>
              <span>{currentCriteria?.highLabel}</span>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={currentRating === 0}
              className="fun-button-primary flex items-center gap-3 text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {currentCriteriaIndex < SELF_EVAL_CRITERIA.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-6 h-6" />
                </>
              ) : currentConceptIndex < selectedNotes.length - 1 ? (
                <>
                  Next Concept
                  <ArrowRight className="w-6 h-6" />
                </>
              ) : (
                <>
                  See Results
                  <Sparkles className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
