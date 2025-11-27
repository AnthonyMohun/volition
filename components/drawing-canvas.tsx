"use client";

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Undo2, Redo2, Eraser, Trash2, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingData, CanvasPath, STICKY_COLORS } from "@/lib/types";

interface DrawingCanvasProps {
  initialDrawing?: DrawingData;
  strokeColor?: string;
  width?: number;
  height?: number;
  onSave?: (drawing: DrawingData) => void;
  onDrawingChange?: (hasContent: boolean) => void;
  noteColor?: string;
}

export interface DrawingCanvasHandle {
  save: () => Promise<DrawingData | null>;
  clear: () => void;
  hasContent: () => boolean;
}

// Get a good stroke color that contrasts with the note background
const getStrokeColor = (noteColor: string): string => {
  const strokeMap: Record<string, string> = {
    "#fef3c7": "#92400e", // yellow -> amber-800
    "#fecaca": "#991b1b", // red -> red-800
    "#bbf7d0": "#166534", // green -> green-800
    "#bfdbfe": "#1e40af", // blue -> blue-800
    "#dbeafe": "#1e40af", // light blue -> blue-800
    "#dcfce7": "#0f766e", // light teal -> teal-800
  };
  return strokeMap[noteColor] || "#374151"; // default gray-700
};

// Stroke width options
const STROKE_WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 8, label: "Thick" },
];

export const DrawingCanvas = forwardRef<
  DrawingCanvasHandle,
  DrawingCanvasProps
>(function DrawingCanvas(
  {
    initialDrawing,
    strokeColor: propStrokeColor,
    width = 280,
    height = 200,
    onSave,
    onDrawingChange,
    noteColor = "#fef3c7",
  },
  ref
) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeColor, setStrokeColor] = useState(
    propStrokeColor || getStrokeColor(noteColor)
  );
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Color palette matching sticky note colors (darker versions for drawing)
  const stickyNoteStrokeColors = STICKY_COLORS.map((color) =>
    getStrokeColor(color)
  );

  // Add black/gray for basic drawing
  const colorPalette = [
    "#1f2937", // gray-800 (dark/black)
    ...stickyNoteStrokeColors,
  ];

  // Load initial drawing if provided
  useEffect(() => {
    if (initialDrawing?.paths && canvasRef.current) {
      canvasRef.current.loadPaths(initialDrawing.paths);
      setHasContent(initialDrawing.paths.length > 0);
    }
  }, [initialDrawing]);

  // Update stroke color when note color changes
  useEffect(() => {
    if (!propStrokeColor) {
      setStrokeColor(getStrokeColor(noteColor));
    }
  }, [noteColor, propStrokeColor]);

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setHasContent(false);
    onDrawingChange?.(false);
  };

  const toggleEraser = () => {
    if (isEraser) {
      canvasRef.current?.eraseMode(false);
      setIsEraser(false);
    } else {
      canvasRef.current?.eraseMode(true);
      setIsEraser(true);
    }
  };

  const handleStroke = () => {
    setHasContent(true);
    onDrawingChange?.(true);
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await canvasRef.current.exportImage("png");
      const link = document.createElement("a");
      link.download = `sketch-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download drawing:", error);
    }
  };

  const saveDrawing = async (): Promise<DrawingData | null> => {
    if (!canvasRef.current) return null;

    try {
      const paths = await canvasRef.current.exportPaths();
      if (paths.length === 0) return null;

      const dataUrl = await canvasRef.current.exportImage("png");

      const drawing: DrawingData = {
        paths: paths as CanvasPath[],
        dataUrl,
        width,
        height,
      };

      onSave?.(drawing);
      return drawing;
    } catch (error) {
      console.error("Failed to save drawing:", error);
      return null;
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    save: saveDrawing,
    clear: handleClear,
    hasContent: () => hasContent,
  }));

  return (
    <div
      className="flex flex-col gap-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Drawing Canvas */}
      <div
        className="rounded-xl overflow-hidden border-2 border-gray-200 bg-white shadow-inner mx-auto"
        style={{ width, height }}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          width={`${width}px`}
          height={`${height}px`}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor="transparent"
          exportWithBackgroundImage={false}
          onStroke={handleStroke}
          style={{
            border: "none",
            borderRadius: "0.75rem",
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4">
        {/* Stroke Width */}
        <div className="flex items-center gap-2">
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw.value}
              onClick={() => setStrokeWidth(sw.value)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                strokeWidth === sw.value
                  ? "bg-gray-200 text-gray-800"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              )}
              title={sw.label}
            >
              {sw.value === 2 ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-current rounded-full" />
                </div>
              ) : sw.value === 4 ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-1 bg-current rounded-full" />
                </div>
              ) : (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-2 bg-current rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2">
          {colorPalette.map((color, index) => (
            <button
              key={color}
              onClick={() => {
                setStrokeColor(color);
                setCustomColor(null);
                if (isEraser) {
                  setIsEraser(false);
                  canvasRef.current?.eraseMode(false);
                }
              }}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                strokeColor === color && !isEraser && !customColor
                  ? "border-gray-800 ring-2 ring-gray-300 scale-110"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{ backgroundColor: color }}
              title={index === 0 ? "Black" : `Sticky note color ${index}`}
            />
          ))}

          {/* Custom Color Picker */}
          <div className="relative">
            <button
              onClick={() => colorInputRef.current?.click()}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                customColor && strokeColor === customColor && !isEraser
                  ? "border-gray-800 ring-2 ring-gray-300 scale-110"
                  : "border-gray-300 border-dashed hover:border-gray-400"
              )}
              style={{ backgroundColor: customColor || "white" }}
              title="Custom color"
            >
              {!customColor && <Plus className="w-3 h-3 text-gray-400" />}
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={customColor || "#000000"}
              onChange={(e) => {
                const color = e.target.value;
                setCustomColor(color);
                setStrokeColor(color);
                if (isEraser) {
                  setIsEraser(false);
                  canvasRef.current?.eraseMode(false);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEraser}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isEraser
                ? "bg-teal-100 text-teal-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            )}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={handleUndo}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-500 transition-all"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-100 hover:text-blue-500 transition-all"
            title="Download sketch"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
