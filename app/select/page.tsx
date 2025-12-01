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
        icon={<Sparkles className="w-5 h-5 text-blue-500" />}
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
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex relative">
        {/* Center - Card swipe area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Card Stack Container */}
            <div className="relative w-full h-[450px] flex items-center justify-center">
              {!isComplete ? (
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
                            className="w-[360px] h-[320px] p-5 rounded-3xl border-4 shadow-xl"
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
                        className="w-full max-w-[360px] p-6 rounded-3xl border-4 shadow-2xl relative overflow-hidden select-none"
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
                /* Completion state */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center fun-card p-10 border-3 border-green-300 bg-gradient-to-br from-green-50 to-white max-w-sm">
                    <div className="text-7xl mb-5">🎉</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-3">
                      All Done!
                    </h3>
                    <p className="text-gray-600 font-medium mb-6">
                      You've selected{" "}
                      <span className="font-bold text-green-600">
                        {selectedConcepts.length}
                      </span>{" "}
                      concept
                      {selectedConcepts.length !== 1 ? "s" : ""} to refine
                    </p>
                    {selectedConcepts.length >= minConcepts ? (
                      <button
                        onClick={handleProceedToRefine}
                        className="fun-button-primary flex items-center gap-2 font-bold px-8 py-4 shadow-lg hover:shadow-green mx-auto text-lg"
                      >
                        <Trophy className="w-5 h-5" />
                        Continue to Refine
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                          <p className="text-orange-700 font-semibold flex items-center justify-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            You need at least {minConcepts} concepts
                          </p>
                        </div>
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

            {/* Controls below cards */}
            {!isComplete && (
              <div className="flex items-center justify-center gap-8 mt-4">
                {/* Skip button */}
                <button
                  onClick={() => animateOut("left")}
                  disabled={isAnimatingOut !== null}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-5 bg-white hover:bg-red-50 border-3 border-red-200 hover:border-red-400 rounded-full shadow-lg hover:shadow-xl transition-all group-hover:scale-110 group-active:scale-95">
                    <X className="w-7 h-7 text-red-400 group-hover:text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Skip</span>
                </button>

                {/* Undo button - centered */}
                <button
                  onClick={handleUndo}
                  disabled={swipeHistory.length === 0}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-30 group-hover:scale-105 group-active:scale-95">
                    <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
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
                  <div className="p-5 bg-white hover:bg-green-50 border-3 border-green-200 hover:border-green-400 rounded-full shadow-lg hover:shadow-xl transition-all group-hover:scale-110 group-active:scale-95">
                    <Heart className="w-7 h-7 text-green-400 group-hover:text-green-500 group-hover:fill-green-500 transition-all" />
                  </div>
                  <span className="text-sm font-bold text-green-500">Keep</span>
                </button>
              </div>
            )}

            {/* Remaining count */}
            {!isComplete && (
              <p className="text-sm text-gray-400 font-medium mt-2">
                {remainingCards.length} card
                {remainingCards.length !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>

        {/* Right sidebar - Selected concepts */}
        <div className="w-80 border-l border-gray-200/50 bg-white/40 backdrop-blur-sm p-5 flex flex-col">
          {/* HMW Statement */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Challenge
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              {state.hmwStatement}
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

          {/* Selected concepts header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="text-sm font-bold text-gray-700">
                Selected Concepts
              </span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedConcepts.length >= minConcepts
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {selectedConcepts.length}/{maxConcepts}
            </div>
          </div>

          {/* Selected concept slots */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {[...Array(maxConcepts)].map((_, idx) => {
              const concept = selectedConceptNotes[idx];
              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl transition-all duration-300 ${
                    concept
                      ? "animate-slide-up"
                      : "border-2 border-dashed border-gray-200 bg-gray-50/50"
                  }`}
                  style={{
                    backgroundColor: concept
                      ? getFunColor(concept.color)
                      : undefined,
                    borderColor: concept
                      ? getAccentColor(concept.color)
                      : undefined,
                    borderWidth: concept ? "2px" : undefined,
                    borderStyle: concept ? "solid" : undefined,
                  }}
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
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {concept.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-center">
                      <span className="text-sm text-gray-400 font-medium">
                        Slot {idx + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Continue button at bottom of sidebar */}
          {selectedConcepts.length >= minConcepts && (
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <button
                onClick={handleProceedToRefine}
                className="w-full fun-button-primary flex items-center justify-center gap-2 font-bold text-sm"
              >
                <Trophy className="w-4 h-4" />
                Continue to Refine
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Keyboard hints */}
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">
                Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  ←
                </kbd>
                <span>Skip</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                  →
                </kbd>
                <span>Keep</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
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
