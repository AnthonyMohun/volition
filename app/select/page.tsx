"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { StickyNote } from "@/lib/types";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Heart,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Keyboard,
  Sparkles,
  Trophy,
  X,
  Rocket,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function SelectPage() {
  const router = useRouter();
  const {
    state,
    setPhase,
    setSelectedConcepts: saveSelectedConcepts,
  } = useSession();
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [skippedConcepts, setSkippedConcepts] = useState<string[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<
    { id: string; direction: "left" | "right" }[]
  >([]);
  const [showCompletionCard, setShowCompletionCard] = useState(false);

  // Drag state for top card
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [isAnimatingOut, setIsAnimatingOut] = useState<"left" | "right" | null>(
    null
  );
  const [isNewTopCard, setIsNewTopCard] = useState(false);
  const [lastTopCardId, setLastTopCardId] = useState<string | null>(null);

  const conceptNotes = state.notes.filter((n) => n.isConcept);
  const minConcepts = 2;
  const maxConcepts = Math.min(3, conceptNotes.length);

  // Remaining cards to swipe
  const remainingCards = conceptNotes.filter(
    (note) =>
      !selectedConcepts.includes(note.id) && !skippedConcepts.includes(note.id)
  );

  // Show completion card when all concept cards have been swiped
  const allCardsReviewed =
    remainingCards.length === 0 && conceptNotes.length > 0;
  const hasEnoughConcepts = selectedConcepts.length >= minConcepts;
  const isComplete = selectedConcepts.length >= maxConcepts;
  const topCard = showCompletionCard ? null : remainingCards[0];

  // When all cards are reviewed, show completion card
  useEffect(() => {
    if (allCardsReviewed && !showCompletionCard) {
      // Small delay to let the last card animate out
      const timer = setTimeout(() => setShowCompletionCard(true), 350);
      return () => clearTimeout(timer);
    }
  }, [allCardsReviewed, showCompletionCard]);

  // Track when a new card becomes top - skip entrance transition
  useEffect(() => {
    if (topCard && topCard.id !== lastTopCardId) {
      setIsNewTopCard(true);
      setLastTopCardId(topCard.id);
      // Allow transitions again after a brief moment
      const timer = setTimeout(() => setIsNewTopCard(false), 50);
      return () => clearTimeout(timer);
    }
  }, [topCard, lastTopCardId]);

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < minConcepts) {
      router.push("/canvas");
    }
  }, [state.hmwStatement, conceptNotes.length, router]);

  const handleSwipe = useCallback(
    (noteId: string, direction: "left" | "right") => {
      setSwipeHistory((prev) => [...prev, { id: noteId, direction }]);

      if (direction === "right") {
        setSelectedConcepts((prev) => {
          if (prev.length < maxConcepts) {
            return [...prev, noteId];
          }
          return prev;
        });
      } else {
        setSkippedConcepts((prev) => [...prev, noteId]);
      }

      // Reset states
      setIsAnimatingOut(null);
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      });
    },
    [maxConcepts]
  );

  const animateOut = useCallback(
    (direction: "left" | "right") => {
      if (!topCard || isAnimatingOut) return;
      setIsAnimatingOut(direction);
      setTimeout(() => {
        handleSwipe(topCard.id, direction);
      }, 300);
    },
    [topCard, isAnimatingOut, handleSwipe]
  );

  // Mouse/Touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimatingOut) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.isDragging || isAnimatingOut) return;
    setDragState((prev) => ({
      ...prev,
      offsetX: e.clientX - prev.startX,
      offsetY: (e.clientY - prev.startY) * 0.3,
    }));
  };

  const handlePointerUp = () => {
    if (!dragState.isDragging || isAnimatingOut) return;

    const THRESHOLD = 100;
    if (dragState.offsetX > THRESHOLD) {
      animateOut("right");
    } else if (dragState.offsetX < -THRESHOLD) {
      animateOut("left");
    } else {
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || !topCard || isAnimatingOut) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        animateOut("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        animateOut("right");
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isComplete, topCard, isAnimatingOut, animateOut]);

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

    if (lastAction.direction === "right") {
      setSelectedConcepts((prev) => prev.filter((id) => id !== lastAction.id));
    } else {
      setSkippedConcepts((prev) => prev.filter((id) => id !== lastAction.id));
    }
  };

  const handleProceedToRefine = () => {
    if (
      selectedConcepts.length >= minConcepts &&
      selectedConcepts.length <= maxConcepts
    ) {
      saveSelectedConcepts(selectedConcepts, {});
      setPhase("select");
      router.push("/refine");
    }
  };

  const handleStartNewProject = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      router.push("/");
    }
  };

  const handleReset = () => {
    setSelectedConcepts([]);
    setSkippedConcepts([]);
    setSwipeHistory([]);
    setShowCompletionCard(false);
  };

  const getFunColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#fef3c7": "#fef3c7",
      "#fecaca": "#fecaca",
      "#bbf7d0": "#bbf7d0",
      "#bfdbfe": "#bfdbfe",
      "#e9d5ff": "#e9d5ff",
      "#fbcfe8": "#fbcfe8",
    };
    return colorMap[color] || "#ffffff";
  };

  const getAccentColor = (color: string) => {
    const accentMap: Record<string, string> = {
      "#fef3c7": "#fbbf24",
      "#fecaca": "#f87171",
      "#bbf7d0": "#34d399",
      "#bfdbfe": "#60a5fa",
      "#e9d5ff": "#a78bfa",
      "#fbcfe8": "#f472b6",
    };
    return accentMap[color] || "#e5e7eb";
  };

  // Calculate swipe indicator opacity
  const swipeProgress = Math.min(Math.abs(dragState.offsetX) / 100, 1);
  const swipeDirection =
    dragState.offsetX > 30 ? "right" : dragState.offsetX < -30 ? "left" : null;

  // Get selected concept notes for sidebar display
  const selectedConceptNotes = conceptNotes.filter((n) =>
    selectedConcepts.includes(n.id)
  );

  if (!state.hmwStatement || conceptNotes.length < minConcepts) {
    return null;
  }

  return (
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-teal-300/20 rounded-full blur-3xl float-animation" />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gradient-to-br from-orange-300/25 to-pink-300/20 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-green-300/20 to-yellow-300/15 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "3s" }}
        />

        {/* Floating emojis - more subtle */}
        <div className="absolute top-24 left-[8%] text-4xl opacity-15 float-animation">
          ⭐
        </div>
        <div
          className="absolute top-32 right-[12%] text-3xl opacity-15 float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-40 left-[15%] text-3xl opacity-15 float-animation"
          style={{ animationDelay: "2s" }}
        >
          ✨
        </div>
        <div
          className="absolute bottom-28 right-[20%] text-4xl opacity-15 float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🎯
        </div>
      </div>

      <PageHeader
        title="Concept Selection"
        icon={<Sparkles className="w-5 h-5 text-teal-500" />}
        backPath="/canvas"
        onNewProject={handleStartNewProject}
        rightContent={
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
              <span className="text-sm font-medium text-gray-500">
                {conceptNotes.length - remainingCards.length} of{" "}
                {conceptNotes.length} reviewed
              </span>
            </div>
            <button
              onClick={handleReset}
              disabled={swipeHistory.length === 0}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Start over"
            >
              <RotateCcw className="w-5 h-5 text-gray-400" />
            </button>
          </>
        }
      />
      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Left sidebar - Instructions (hidden on mobile) */}
        <div
          className="hidden lg:flex w-64 xl:w-72 p-5 flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            borderRight: "2px solid rgba(255, 255, 255, 0.6)",
            boxShadow:
              "4px 0 16px rgba(163, 177, 198, 0.15), inset -1px 0 2px rgba(163, 177, 198, 0.08), inset 1px 0 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Tips section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Quick Tips
              </span>
            </div>
            <div className="space-y-3">
              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)",
                  border: "1px solid rgba(226, 232, 240, 0.5)",
                  boxShadow:
                    "0 2px 6px rgba(163, 177, 198, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(220,252,231,0.9) 0%, rgba(187,247,208,0.7) 100%)",
                    boxShadow: "0 1px 3px rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <Heart className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Swipe Right
                  </p>
                  <p className="text-xs text-gray-500">
                    Keep concepts that excite you
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.6) 100%)",
                  border: "1px solid rgba(226, 232, 240, 0.5)",
                  boxShadow:
                    "0 2px 6px rgba(163, 177, 198, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(254,226,226,0.9) 0%, rgba(254,202,202,0.7) 100%)",
                    boxShadow: "0 1px 3px rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Swipe Left
                  </p>
                  <p className="text-xs text-gray-500">
                    Skip concepts to revisit later
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent mb-6" />

          {/* What to look for */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                What to Consider
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-teal-500 mt-0.5">•</span>
                <span>Does this concept solve the core challenge?</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-teal-500 mt-0.5">•</span>
                <span>Is it feasible to implement?</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-teal-500 mt-0.5">•</span>
                <span>Does it spark your creativity?</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-teal-500 mt-0.5">•</span>
                <span>Would users find it valuable?</span>
              </li>
            </ul>
          </div>

          {/* Decorative element at bottom */}
          <div className="mt-auto pt-6">
            <div
              className="p-4 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(240,253,250,0.8) 0%, rgba(239,246,255,0.6) 100%)",
                border: "1px solid rgba(153, 246, 228, 0.3)",
                boxShadow:
                  "0 2px 8px rgba(20, 184, 166, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-700">
                  Focus on quality.
                </span>{" "}
                You can always come back to explore more concepts later.
              </p>
            </div>
          </div>
        </div>

        {/* Center - Card swipe area */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6">
          <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-md">
            {/* Card Stack Container */}
            <div className="relative w-full h-[380px] md:h-[450px] flex items-center justify-center">
              {/* Show completion card at end of stack */}
              {showCompletionCard ? (
                <div
                  className="absolute flex justify-center animate-slide-up"
                  style={{ zIndex: 20 }}
                >
                  <div className="w-full max-w-[300px] md:max-w-[360px] p-6 md:p-8 rounded-3xl border-4 shadow-2xl relative overflow-hidden select-none bg-gradient-to-br from-green-50 via-white to-teal-50 border-green-300">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-200/40 to-transparent rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10 text-center">
                      <div className="text-6xl mb-4 animate-bounce-in">🎉</div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2">
                        All Reviewed!
                      </h3>
                      <p className="text-gray-600 font-medium mb-6">
                        You've selected{" "}
                        <span
                          className={`font-bold ${
                            hasEnoughConcepts
                              ? "text-green-600"
                              : "text-orange-500"
                          }`}
                        >
                          {selectedConcepts.length}
                        </span>{" "}
                        concept{selectedConcepts.length !== 1 ? "s" : ""}
                      </p>

                      {hasEnoughConcepts ? (
                        <div className="space-y-3">
                          <button
                            onClick={handleProceedToRefine}
                            className="w-full fun-button-primary flex items-center justify-center gap-2 font-bold px-6 py-4 text-base"
                          >
                            <Rocket className="w-5 h-5" />
                            Continue to Refine
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleReset}
                            className="w-full px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Review Again
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                              <span className="font-bold text-orange-700">
                                Need more concepts
                              </span>
                            </div>
                            <p className="text-sm text-orange-600">
                              Select at least {minConcepts} concepts to
                              continue. You have {selectedConcepts.length}.
                            </p>
                          </div>
                          <button
                            onClick={handleReset}
                            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                          >
                            <RotateCcw className="w-5 h-5" />
                            Start Over
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : !isComplete ? (
                <>
                  {/* Stacked cards behind (rendered first = behind) */}
                  {remainingCards
                    .slice(1, 4)
                    .reverse()
                    .map((note, reverseIdx) => {
                      const stackIdx =
                        remainingCards.slice(1, 4).length - reverseIdx; // 1, 2, or 3
                      const yOffset = stackIdx * 10;
                      const scale = 1 - stackIdx * 0.04;

                      return (
                        <div
                          key={note.id}
                          className="absolute flex justify-center transition-all duration-300 ease-out"
                          style={{
                            transform: `translateY(${yOffset}px) scale(${scale})`,
                            zIndex: 10 - stackIdx,
                            opacity: 1 - stackIdx * 0.15,
                          }}
                        >
                          <div
                            className="w-[300px] md:w-[360px] h-[280px] md:h-[320px] p-5 rounded-3xl border-4 shadow-xl"
                            style={{
                              backgroundColor: getFunColor(note.color),
                              borderColor: getAccentColor(note.color),
                            }}
                          />
                        </div>
                      );
                    })}

                  {/* Top card (interactive) */}
                  {topCard && (
                    <div
                      className={`absolute flex justify-center touch-none no-select ${
                        isAnimatingOut
                          ? "transition-all duration-300 ease-out"
                          : dragState.isDragging || isNewTopCard
                          ? ""
                          : "transition-transform duration-200"
                      }`}
                      style={{
                        transform: isAnimatingOut
                          ? `translateX(${
                              isAnimatingOut === "right" ? 500 : -500
                            }px) rotate(${
                              isAnimatingOut === "right" ? 20 : -20
                            }deg)`
                          : `translateX(${dragState.offsetX}px) translateY(${
                              dragState.offsetY
                            }px) rotate(${dragState.offsetX * 0.05}deg)`,
                        opacity: isAnimatingOut ? 0 : 1,
                        zIndex: 20,
                        cursor: "grab",
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      <div
                        className="w-full max-w-[300px] md:max-w-[360px] p-5 md:p-6 rounded-3xl border-4 shadow-2xl relative overflow-hidden select-none"
                        style={{
                          backgroundColor: getFunColor(topCard.color),
                          borderColor: getAccentColor(topCard.color),
                        }}
                      >
                        {/* Swipe indicators */}
                        <div
                          className={`absolute left-4 top-4 bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg flex items-center gap-2 z-20 transition-all ${
                            swipeDirection === "left"
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-90"
                          }`}
                          style={{
                            opacity:
                              swipeDirection === "left" ? swipeProgress : 0,
                          }}
                        >
                          <ThumbsDown className="w-5 h-5" />
                          SKIP
                        </div>
                        <div
                          className={`absolute right-4 top-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg flex items-center gap-2 z-20 transition-all ${
                            swipeDirection === "right"
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-90"
                          }`}
                          style={{
                            opacity:
                              swipeDirection === "right" ? swipeProgress : 0,
                          }}
                        >
                          KEEP
                          <ThumbsUp className="w-5 h-5" />
                        </div>

                        {/* Card number badge */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="font-bold text-gray-600 text-sm">
                              {conceptNotes.length - remainingCards.length + 1}{" "}
                              / {conceptNotes.length}
                            </span>
                          </div>
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-bold text-gray-700 text-xs">
                              Concept
                            </span>
                          </div>
                        </div>

                        {/* Image if present */}
                        {(topCard.image || topCard.drawing?.dataUrl) && (
                          <div className="flex gap-3 mb-4">
                            {topCard.image && !topCard.drawing?.dataUrl && (
                              <img
                                src={topCard.image.dataUrl}
                                alt={topCard.image.caption || "Concept image"}
                                className="w-full h-40 object-cover rounded-2xl border-3 border-white shadow-lg"
                                draggable={false}
                              />
                            )}
                            {topCard.drawing?.dataUrl && !topCard.image && (
                              <img
                                src={topCard.drawing.dataUrl}
                                alt="Concept sketch"
                                className="w-full h-40 object-cover rounded-2xl border-3 border-white shadow-lg bg-white"
                                draggable={false}
                              />
                            )}
                            {topCard.image && topCard.drawing?.dataUrl && (
                              <>
                                <img
                                  src={topCard.image.dataUrl}
                                  alt={topCard.image.caption || "Concept image"}
                                  className="w-1/2 h-40 object-cover rounded-2xl border-3 border-white shadow-lg"
                                  draggable={false}
                                />
                                <img
                                  src={topCard.drawing.dataUrl}
                                  alt={
                                    topCard.image.caption
                                      ? `${topCard.image.caption} (sketch)`
                                      : "Concept sketch"
                                  }
                                  className="w-1/2 h-40 object-cover rounded-2xl border-3 border-white shadow-lg bg-white"
                                  draggable={false}
                                />
                              </>
                            )}
                          </div>
                        )}

                        {/* Main text */}
                        <p className="text-xl text-gray-800 font-bold leading-relaxed mb-4">
                          {topCard.text}
                        </p>

                        {/* Details */}
                        {topCard.details && topCard.details.trim() ? (
                          <div className="bg-white/60 rounded-2xl p-4">
                            <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
                              {topCard.details}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-orange-100/60 rounded-2xl p-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <p className="text-sm text-orange-600 font-medium">
                              No description added
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Max concepts reached before reviewing all cards */
                <div
                  className="absolute flex justify-center animate-slide-up"
                  style={{ zIndex: 20 }}
                >
                  <div className="w-full max-w-[300px] md:max-w-[360px] p-6 md:p-8 rounded-3xl border-4 shadow-2xl relative overflow-hidden select-none bg-gradient-to-br from-green-50 via-white to-teal-50 border-green-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-200/40 to-transparent rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full blur-2xl"></div>

                    <div className="relative z-10 text-center">
                      <div className="text-6xl mb-4 animate-bounce-in">🏆</div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2">
                        Perfect Selection!
                      </h3>
                      <p className="text-gray-600 font-medium mb-6">
                        You've selected{" "}
                        <span className="font-bold text-green-600">
                          {maxConcepts}
                        </span>{" "}
                        concepts to refine
                      </p>
                      <button
                        onClick={handleProceedToRefine}
                        className="w-full fun-button-primary flex items-center justify-center gap-2 font-bold px-6 py-4 text-base"
                      >
                        <Rocket className="w-5 h-5" />
                        Continue to Refine
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls below cards */}
            {!showCompletionCard && !isComplete && topCard && (
              <div className="flex items-center justify-center gap-6 md:gap-8 mt-4">
                {/* Skip button */}
                <button
                  onClick={() => animateOut("left")}
                  disabled={isAnimatingOut !== null}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-4 md:p-5 bg-white hover:bg-red-50 border-3 border-red-200 hover:border-red-400 rounded-full shadow-lg hover:shadow-xl transition-all group-hover:scale-110 group-active:scale-95 touch-target">
                    <X className="w-6 md:w-7 h-6 md:h-7 text-red-400 group-hover:text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Skip</span>
                </button>

                {/* Undo button - centered */}
                <button
                  onClick={handleUndo}
                  disabled={swipeHistory.length === 0}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-3 md:p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-30 group-hover:scale-105 group-active:scale-95 touch-target-sm">
                    <RotateCcw className="w-4 md:w-5 h-4 md:h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    Undo
                  </span>
                </button>

                {/* Keep button */}
                <button
                  onClick={() => animateOut("right")}
                  disabled={
                    isAnimatingOut !== null ||
                    selectedConcepts.length >= maxConcepts
                  }
                  className="flex flex-col items-center gap-2 group disabled:opacity-50"
                >
                  <div className="p-4 md:p-5 bg-white hover:bg-green-50 border-3 border-green-200 hover:border-green-400 rounded-full shadow-lg hover:shadow-xl transition-all group-hover:scale-110 group-active:scale-95 touch-target">
                    <Heart className="w-6 md:w-7 h-6 md:h-7 text-green-400 group-hover:text-green-500 group-hover:fill-green-500 transition-all" />
                  </div>
                  <span className="text-sm font-bold text-green-500">Keep</span>
                </button>
              </div>
            )}

            {/* Progress indicator */}
            {!showCompletionCard && !isComplete && (
              <div className="flex flex-col items-center gap-3 mt-4">
                {/* Progress bar */}
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300"
                    style={{
                      width: `${
                        ((conceptNotes.length - remainingCards.length) /
                          conceptNotes.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {remainingCards.length} card
                  {remainingCards.length !== 1 ? "s" : ""} remaining
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Selected concepts */}
        <div
          className="w-full md:w-72 lg:w-80 p-4 md:p-5 flex flex-col md:max-h-none max-h-[30vh] md:overflow-visible overflow-y-auto momentum-scroll border-t-2 md:border-t-0 md:border-l-2 border-white/60"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            boxShadow:
              "-4px 0 16px rgba(163, 177, 198, 0.15), inset 1px 0 2px rgba(163, 177, 198, 0.08), inset -1px 0 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* HMW Statement */}
          <div
            className="mb-4 md:mb-5 p-3 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,246,255,0.7) 0%, rgba(240,249,255,0.5) 100%)",
              border: "1px solid rgba(186, 230, 253, 0.4)",
              boxShadow:
                "0 2px 6px rgba(163, 177, 198, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Challenge
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
              {state.hmwStatement}
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent mb-4 md:mb-5" />

          {/* Selected concepts header */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="text-sm font-semibold text-gray-700">
                Selected Concepts
              </span>
            </div>
            <div
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background:
                  selectedConcepts.length >= minConcepts
                    ? "linear-gradient(135deg, rgba(220,252,231,0.9) 0%, rgba(187,247,208,0.7) 100%)"
                    : "linear-gradient(135deg, rgba(255,237,213,0.9) 0%, rgba(254,215,170,0.7) 100%)",
                color:
                  selectedConcepts.length >= minConcepts
                    ? "#15803d"
                    : "#c2410c",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {selectedConcepts.length}/{maxConcepts}
            </div>
          </div>

          {/* Minimum concepts hint */}
          {selectedConcepts.length < minConcepts && (
            <div
              className="mb-3 p-2.5 rounded-xl flex items-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,251,235,0.8) 0%, rgba(254,243,199,0.6) 100%)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                boxShadow: "0 1px 3px rgba(251, 191, 36, 0.08)",
              }}
            >
              <Target className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Select at least {minConcepts} concepts to continue
              </p>
            </div>
          )}

          {/* Selected concept slots */}
          <div className="flex-1 flex md:flex-col flex-row gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden momentum-scroll">
            {[...Array(maxConcepts)].map((_, idx) => {
              const concept = selectedConceptNotes[idx];
              const isRequired = idx < minConcepts;
              return (
                <div
                  key={idx}
                  className="relative rounded-xl transition-all duration-300 flex-shrink-0 md:flex-shrink w-40 md:w-auto"
                  style={
                    concept
                      ? {
                          background: `linear-gradient(135deg, ${getFunColor(
                            concept.color
                          )}ee 0%, ${getFunColor(concept.color)}cc 100%)`,
                          border: `1px solid ${getAccentColor(
                            concept.color
                          )}60`,
                          boxShadow:
                            "0 2px 8px rgba(163, 177, 198, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.6)",
                        }
                      : {
                          background: isRequired
                            ? "linear-gradient(135deg, rgba(255,251,235,0.4) 0%, rgba(254,243,199,0.3) 100%)"
                            : "linear-gradient(135deg, rgba(248,250,252,0.5) 0%, rgba(241,245,249,0.4) 100%)",
                          border: isRequired
                            ? "1px dashed rgba(251, 191, 36, 0.4)"
                            : "1px dashed rgba(203, 213, 225, 0.6)",
                        }
                  }
                >
                  {concept ? (
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                            {concept.text}
                          </p>
                          {concept.details && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1 hidden md:block">
                              {concept.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 md:p-4 flex items-center justify-center gap-2">
                      {isRequired && (
                        <Star className="w-3 h-3 text-amber-400" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isRequired ? "text-amber-500" : "text-gray-400"
                        }`}
                      >
                        {isRequired ? "Required" : "Optional"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Continue button at bottom of sidebar - only show when NOT on completion card */}
          {selectedConcepts.length >= minConcepts && !showCompletionCard && (
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200/30">
              <button
                onClick={handleProceedToRefine}
                className="w-full fun-button-primary flex items-center justify-center gap-2 font-bold text-sm touch-target"
              >
                <Rocket className="w-4 h-4" />
                Continue to Refine
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Keyboard hints - hidden on touch devices */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200/30 hidden md:block">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">
                Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.8) 100%)",
                    border: "1px solid rgba(203, 213, 225, 0.5)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  ←
                </kbd>
                <span>Skip</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.8) 100%)",
                    border: "1px solid rgba(203, 213, 225, 0.5)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  →
                </kbd>
                <span>Keep</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.8) 100%)",
                    border: "1px solid rgba(203, 213, 225, 0.5)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  ⌘Z
                </kbd>
                <span>Undo last action</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
