"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { HMWHelperModal } from "./hmw-helper-modal";
import { DrawingCanvas, DrawingCanvasHandle } from "./drawing-canvas";
import { DrawingData, StickyNote, STICKY_COLORS } from "@/lib/types";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Timer,
  Lightbulb,
  Rocket,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CrazyEightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "setup" | "sketching" | "complete";

interface Sketch {
  id: string;
  drawing: DrawingData | null;
  number: number;
}

export function CrazyEightsModal({ isOpen, onClose }: CrazyEightsModalProps) {
  const router = useRouter();
  const { updateHMW, setPhase, addNote } = useSession();
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // Setup phase state
  const [hmwInput, setHmwInput] = useState("");
  const [showHMWHelper, setShowHMWHelper] = useState(false);
  const [sketchCount, setSketchCount] = useState(8);
  const [timePerSketch, setTimePerSketch] = useState(60); // seconds

  // Sketching phase state
  const [phase, setModalPhase] = useState<Phase>("setup");
  const [currentSketchIndex, setCurrentSketchIndex] = useState(0);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStartedCurrentSketch, setHasStartedCurrentSketch] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Auto-save when timer runs out
          handleSaveCurrentSketch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setModalPhase("setup");
      setHmwInput("");
      setSketchCount(8);
      setTimePerSketch(60);
      setCurrentSketchIndex(0);
      setSketches([]);
      setTimeRemaining(60);
      setIsTimerRunning(false);
      setHasStartedCurrentSketch(false);
    }
  }, [isOpen]);

  const initializeSketches = () => {
    const newSketches: Sketch[] = Array.from(
      { length: sketchCount },
      (_, i) => ({
        id: `sketch-${Date.now()}-${i}`,
        drawing: null,
        number: i + 1,
      })
    );
    setSketches(newSketches);
  };

  const handleStartSprint = () => {
    if (!hmwInput.trim()) return;
    initializeSketches();
    setTimeRemaining(timePerSketch);
    setModalPhase("sketching");
    setCurrentSketchIndex(0);
    // Auto-start timer
    setHasStartedCurrentSketch(true);
    setIsTimerRunning(true);
  };

  const handleSaveCurrentSketch =
    useCallback(async (): Promise<DrawingData | null> => {
      if (!canvasRef.current) return null;

      const drawing = await canvasRef.current.save();
      if (drawing) {
        setSketches((prev) =>
          prev.map((s, i) => (i === currentSketchIndex ? { ...s, drawing } : s))
        );
      }
      return drawing;
    }, [currentSketchIndex]);

  const handleNextSketch = async () => {
    const savedDrawing = await handleSaveCurrentSketch();

    if (currentSketchIndex < sketchCount - 1) {
      setCurrentSketchIndex((prev) => prev + 1);
      setTimeRemaining(timePerSketch);
      // Auto-start timer for next sketch
      setIsTimerRunning(true);
      setHasStartedCurrentSketch(true);
      // Clear canvas for new sketch
      setTimeout(() => canvasRef.current?.clear(), 0);
    } else {
      // All sketches complete - update sketches state synchronously before changing phase
      if (savedDrawing) {
        setSketches((prev) =>
          prev.map((s, i) =>
            i === currentSketchIndex ? { ...s, drawing: savedDrawing } : s
          )
        );
      }
      // Small delay to ensure last sketch state is updated before showing complete view
      setTimeout(() => {
        setModalPhase("complete");
        setIsTimerRunning(false);
      }, 50);
    }
  };

  const handlePreviousSketch = async () => {
    if (currentSketchIndex > 0) {
      await handleSaveCurrentSketch();
      setCurrentSketchIndex((prev) => prev - 1);
      setIsTimerRunning(false);
      setHasStartedCurrentSketch(false);
    }
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setHasStartedCurrentSketch(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimeRemaining(timePerSketch);
    setIsTimerRunning(false);
  };

  const handleSelectHMWTemplate = (statement: string) => {
    setHmwInput(statement);
    setShowHMWHelper(false);
  };

  const handleImportToCanvas = async () => {
    // Create sticky notes for each sketch with content
    const sketchesWithContent = sketches.filter((s) => s.drawing);

    if (sketchesWithContent.length === 0) {
      // Update HMW first, then close and navigate
      updateHMW(hmwInput.trim());
      setPhase("canvas");
      onClose();
      router.push("/canvas");
      return;
    }

    // Calculate positions in a grid layout - center on canvas (2000, 1500)
    const CANVAS_CENTER_X = 2000;
    const CANVAS_CENTER_Y = 1500;
    const columns = Math.ceil(Math.sqrt(sketchesWithContent.length));
    const noteWidth = 280;
    const noteHeight = 250;
    const gap = 40;

    const baseTime = Date.now();

    // Calculate grid dimensions to center properly
    const totalGridWidth = columns * (noteWidth + gap) - gap;
    const rows = Math.ceil(sketchesWithContent.length / columns);
    const totalGridHeight = rows * (noteHeight + gap) - gap;

    // Add notes with unique IDs and timestamps
    for (let index = 0; index < sketchesWithContent.length; index++) {
      const sketch = sketchesWithContent[index];
      const col = index % columns;
      const row = Math.floor(index / columns);

      const note: StickyNote = {
        id: `crazy8-${baseTime}-${index}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        text: `Crazy 8 Sketch #${sketch.number}`,
        x: CANVAS_CENTER_X - totalGridWidth / 2 + col * (noteWidth + gap),
        y: CANVAS_CENTER_Y - totalGridHeight / 2 + row * (noteHeight + gap),
        color: STICKY_COLORS[index % STICKY_COLORS.length],
        isConcept: false,
        drawing: sketch.drawing!,
        contentType: "drawing",
        createdAt: baseTime + index,
      };
      addNote(note);
    }

    // Update HMW and set phase
    updateHMW(hmwInput.trim());
    setPhase("canvas");

    // Give React time to process the state updates before closing/navigating
    // The state needs to be saved to localStorage before we navigate
    await new Promise((resolve) => setTimeout(resolve, 200));

    onClose();
    router.push("/canvas");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completedSketches = sketches.filter((s) => s.drawing).length;
  const totalTime = Math.ceil((sketchCount * timePerSketch) / 60);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-blue-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
        <div className="fun-card p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <h2 className="text-2xl font-black fun-gradient-text">
                  Crazy Eights Sprint
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  {phase === "setup" &&
                    "Rapid sketching exercise for quick ideation"}
                  {phase === "sketching" &&
                    `Sketch ${currentSketchIndex + 1} of ${sketchCount}`}
                  {phase === "complete" &&
                    "Sprint complete! Review your sketches"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center hover:rotate-90 transform duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Setup Phase */}
            {phase === "setup" && (
              <div className="space-y-6">
                {/* Intro */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">
                        What is Crazy Eights?
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        A rapid sketching exercise where you create multiple
                        design ideas quickly. Fold a sheet of paper into
                        sections and spend one minute on each sketch. The time
                        pressure helps you focus on big ideas rather than
                        details!
                      </p>
                    </div>
                  </div>
                </div>

                {/* HMW Input */}
                <div>
                  <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                    <span className="text-lg">💭</span>
                    Your Design Challenge
                  </label>
                  <textarea
                    value={hmwInput}
                    onChange={(e) => setHmwInput(e.target.value)}
                    placeholder="Enter your 'How Might We' statement..."
                    className="w-full px-5 py-4 bg-gradient-to-br from-white to-gray-50/50 border-3 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none text-gray-800 placeholder:text-gray-400 transition-all text-lg font-semibold shadow-sm"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => setShowHMWHelper(true)}
                    className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                  >
                    <span>🛠️</span> Need help? Use the HMW Builder
                  </button>
                </div>

                {/* Sprint Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                      <span className="text-lg">🎨</span>
                      Number of Sketches
                    </label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 4, 6, 8].map((count) => (
                        <button
                          key={count}
                          onClick={() => setSketchCount(count)}
                          className={cn(
                            "w-12 h-12 rounded-xl font-black text-lg transition-all",
                            sketchCount === count
                              ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-lg scale-110"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4" />
                      Time Per Sketch
                    </label>
                    <div className="flex items-center gap-3">
                      {[30, 60, 90, 120].map((time) => (
                        <button
                          key={time}
                          onClick={() => setTimePerSketch(time)}
                          className={cn(
                            "px-4 py-3 rounded-xl font-bold text-sm transition-all",
                            timePerSketch === time
                              ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-lg scale-105"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {time >= 60 ? `${time / 60}m` : `${time}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sprint Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Rocket className="w-6 h-6 text-blue-500" />
                      <div>
                        <p className="font-bold text-gray-800">
                          Sprint Duration
                        </p>
                        <p className="text-sm text-gray-600">
                          {sketchCount} sketch{sketchCount !== 1 ? "es" : ""} ×{" "}
                          {timePerSketch}s = ~{totalTime} minute
                          {totalTime !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStartSprint}
                      disabled={!hmwInput.trim()}
                      className="fun-button-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-black">Start Sprint</span>
                      <span className="ml-2">🚀</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sketching Phase */}
            {phase === "sketching" && (
              <div className="space-y-4">
                {/* HMW Display */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm font-bold text-amber-700 mb-1">
                    Challenge:
                  </p>
                  <p className="text-gray-800 font-medium">{hmwInput}</p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-4">
                  <div
                    className={cn(
                      "text-5xl font-black tabular-nums transition-colors",
                      timeRemaining <= 10 && isTimerRunning
                        ? "text-red-500 animate-pulse"
                        : timeRemaining <= 30 && isTimerRunning
                        ? "text-amber-500"
                        : "text-gray-800"
                    )}
                  >
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasStartedCurrentSketch ? (
                      <button
                        onClick={handleStartTimer}
                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-lg hover:scale-110"
                      >
                        <Play className="w-6 h-6" />
                      </button>
                    ) : isTimerRunning ? (
                      <button
                        onClick={handlePauseTimer}
                        className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all shadow-lg hover:scale-110"
                      >
                        <Pause className="w-6 h-6" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStartTimer}
                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-lg hover:scale-110"
                      >
                        <Play className="w-6 h-6" />
                      </button>
                    )}
                    <button
                      onClick={handleResetTimer}
                      className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                  {sketches.map((sketch, index) => (
                    <div
                      key={sketch.id}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
                        index === currentSketchIndex
                          ? "bg-blue-500 scale-125"
                          : sketch.drawing
                          ? "bg-green-500"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* Drawing Canvas */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                  <DrawingCanvas
                    ref={canvasRef}
                    width="100%"
                    height={350}
                    noteColor="#ffffff"
                  />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousSketch}
                    disabled={currentSketchIndex === 0}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
                      currentSketchIndex === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-sm font-bold text-gray-500">
                    Sketch {currentSketchIndex + 1} of {sketchCount}
                  </span>

                  <button
                    onClick={handleNextSketch}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {currentSketchIndex === sketchCount - 1 ? (
                      <>
                        Finish <Check className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Complete Phase */}
            {phase === "complete" && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    Sprint Complete!
                  </h3>
                  <p className="text-gray-600 font-medium">
                    You created {completedSketches} sketch
                    {completedSketches !== 1 ? "es" : ""} for your challenge
                  </p>
                </div>

                {/* Sketch Preview Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sketches.map((sketch) => (
                    <div
                      key={sketch.id}
                      className={cn(
                        "aspect-square rounded-xl border-2 overflow-hidden bg-white",
                        sketch.drawing ? "border-green-300" : "border-gray-200"
                      )}
                    >
                      {sketch.drawing?.dataUrl ? (
                        <img
                          src={sketch.drawing.dataUrl}
                          alt={`Sketch ${sketch.number}`}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        #{sketch.number}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      setModalPhase("setup");
                      setSketches([]);
                      setCurrentSketchIndex(0);
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                  >
                    Start Over
                  </button>
                  {completedSketches > 0 && (
                    <button
                      onClick={handleImportToCanvas}
                      className="fun-button-primary px-6 py-3"
                    >
                      <span className="font-black">Import to Canvas</span>
                      <span className="ml-2">🎨</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HMW Helper Modal */}
      <HMWHelperModal
        isOpen={showHMWHelper}
        onClose={() => setShowHMWHelper(false)}
        onSelect={handleSelectHMWTemplate}
      />
    </>
  );
}
