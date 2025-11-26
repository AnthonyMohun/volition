"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { StickyNote } from "@/lib/types";
import {
  ArrowLeft,
  ListRestart,
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Plus,
  Heart,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

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

  const isComplete =
    remainingCards.length === 0 || selectedConcepts.length >= maxConcepts;
  const topCard = remainingCards[0];

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

  if (!state.hmwStatement || conceptNotes.length < minConcepts) {
    return null;
  }

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
        <div
          className="absolute bottom-20 right-1/3 text-6xl float-animation"
          style={{ animationDelay: "0.5s" }}
        >
          🎯
        </div>
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white to-purple-50/50 border-b-3 border-purple-200 px-6 py-4 flex items-center justify-between shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/canvas")}
            className="p-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
            title="Back to canvas"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
          <button
            onClick={() => router.push("/canvas")}
            className="px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl transition-all flex items-center gap-1.5 border-2 border-purple-200"
            title="Add more concepts"
          >
            <Plus className="w-4 h-4" />
            Add More
          </button>
          <button
            onClick={handleStartNewProject}
            className="p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
            title="Start a new project"
          >
            <ListRestart className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Concept Selection
            </h1>
            <p className="text-sm text-gray-600 font-bold">
              Choose your top {maxConcepts} ideas to develop
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={swipeHistory.length === 0}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* HMW Statement */}
          <div className="w-full fun-card p-4 border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 font-semibold leading-relaxed line-clamp-2">
                {state.hmwStatement}
              </p>
            </div>
          </div>

          {/* Card Stack Container */}
          <div className="relative w-full h-[420px] flex items-center justify-center">
            {!isComplete ? (
              <>
                {/* Stacked cards behind (rendered first = behind) */}
                {remainingCards
                  .slice(1, 4)
                  .reverse()
                  .map((note, reverseIdx) => {
                    const stackIdx =
                      remainingCards.slice(1, 4).length - reverseIdx; // 1, 2, or 3
                    const yOffset = stackIdx * 8;
                    const scale = 1 - stackIdx * 0.03;

                    return (
                      <div
                        key={note.id}
                        className="absolute flex justify-center transition-all duration-300 ease-out"
                        style={{
                          transform: `translateY(${yOffset}px) scale(${scale})`,
                          zIndex: 10 - stackIdx,
                        }}
                      >
                        <div
                          className="w-[340px] h-[280px] p-5 rounded-3xl border-4 shadow-xl"
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
                    className={`absolute flex justify-center touch-none ${
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
                      className="w-full max-w-[340px] p-5 rounded-3xl border-4 shadow-2xl relative overflow-hidden select-none"
                      style={{
                        backgroundColor: getFunColor(topCard.color),
                        borderColor: getAccentColor(topCard.color),
                      }}
                    >
                      {/* Swipe indicators */}
                      <div
                        className={`absolute left-4 top-4 bg-red-500 text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-1.5 z-20 transition-opacity ${
                          swipeDirection === "left"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        style={{
                          opacity:
                            swipeDirection === "left" ? swipeProgress : 0,
                        }}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        NOPE
                      </div>
                      <div
                        className={`absolute right-4 top-4 bg-green-500 text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg flex items-center gap-1.5 z-20 transition-opacity ${
                          swipeDirection === "right"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        style={{
                          opacity:
                            swipeDirection === "right" ? swipeProgress : 0,
                        }}
                      >
                        LIKE
                        <ThumbsUp className="w-4 h-4" />
                      </div>

                      {/* Card badge */}
                      <div className="flex justify-end mb-3">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                          <Star className="w-4 h-4 text-yellow-500 fill-current inline-block mr-1" />
                          <span className="font-bold text-gray-700 text-xs">
                            Concept
                          </span>
                        </div>
                      </div>

                      {/* Image if present */}
                      {topCard.image && (
                        <img
                          src={topCard.image.dataUrl}
                          alt={topCard.image.caption || "Concept sketch"}
                          className="w-full h-36 object-cover rounded-2xl border-3 border-white shadow-lg mb-4"
                          draggable={false}
                        />
                      )}

                      {/* Main text */}
                      <p className="text-lg text-gray-800 font-bold leading-relaxed mb-4">
                        {topCard.text}
                      </p>

                      {/* Details */}
                      {topCard.details && topCard.details.trim() ? (
                        <div className="bg-white/50 rounded-2xl p-3">
                          <p className="text-sm text-gray-600 font-semibold leading-relaxed line-clamp-3">
                            {topCard.details}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-orange-100/50 rounded-2xl p-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <p className="text-sm text-orange-600 font-semibold">
                            No description added
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Completion state */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center fun-card p-8 border-3 border-green-300 bg-gradient-to-br from-green-50 to-white">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    All Done!
                  </h3>
                  <p className="text-gray-600 font-semibold mb-4">
                    You've selected {selectedConcepts.length} concept
                    {selectedConcepts.length !== 1 ? "s" : ""} to refine
                  </p>
                  {selectedConcepts.length >= minConcepts ? (
                    <button
                      onClick={handleProceedToRefine}
                      className="fun-button-primary flex items-center gap-2 font-black px-6 py-3 shadow-lg hover:shadow-purple mx-auto"
                    >
                      Continue to Refine
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      <p className="text-orange-600 font-bold mb-4">
                        ⚠️ You need at least {minConcepts} concepts. Reset and
                        try again!
                      </p>
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all flex items-center gap-2 mx-auto"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Start Over
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls & Status */}
          {!isComplete && (
            <div className="flex items-center justify-center gap-6">
              {/* Skip button */}
              <button
                onClick={() => animateOut("left")}
                disabled={isAnimatingOut !== null}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-4 bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 rounded-2xl shadow-md hover:shadow-lg transition-all group-hover:scale-105 group-active:scale-95">
                  <ArrowLeft className="w-6 h-6 text-red-400 group-hover:text-red-500" />
                </div>
                <span className="text-sm font-bold text-red-500">Skip</span>
              </button>

              {/* Center info - minimal pill */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
                  <Heart className="w-4 h-4 text-purple-500 fill-purple-500" />
                  <span className="font-bold text-gray-700">
                    {selectedConcepts.length}/{maxConcepts}
                  </span>
                  {selectedConcepts.length >= minConcepts && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUndo}
                    disabled={swipeHistory.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo
                  </button>
                  <span className="text-sm text-gray-400">
                    {remainingCards.length} left
                  </span>
                </div>
              </div>

              {/* Keep button */}
              <button
                onClick={() => animateOut("right")}
                disabled={
                  isAnimatingOut !== null ||
                  selectedConcepts.length >= maxConcepts
                }
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-4 bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-300 rounded-2xl shadow-md hover:shadow-lg transition-all group-hover:scale-105 group-active:scale-95 disabled:opacity-50">
                  <ArrowRight className="w-6 h-6 text-green-400 group-hover:text-green-500" />
                </div>
                <span className="text-sm font-bold text-green-500">Keep</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
