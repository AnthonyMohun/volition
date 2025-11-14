"use client";

import { useState, useRef } from "react";
import { StickyNote as StickyNoteType } from "@/lib/types";
import { Trash2, Image as ImageIcon, Star, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (updates: Partial<StickyNoteType>) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function StickyNote({
  note,
  onUpdate,
  onDelete,
  isDragging,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSave = () => {
    if (editText.trim()) {
      onUpdate({ text: editText.trim() });
      setIsEditing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    try {
      const { compressImage } = await import("@/lib/utils");
      const dataUrl = await compressImage(file);

      onUpdate({
        image: {
          dataUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });
    } catch (error) {
      console.error("Failed to process image:", error);
      alert("Failed to process image");
    }
  };

  const handleRemoveImage = () => {
    onUpdate({ image: undefined });
  };

  const toggleConcept = () => {
    onUpdate({ isConcept: !note.isConcept });
  };

  // Dark mode color palette with subtle colored accents
  const getDarkModeColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#fef3c7": "#2a2520", // warm dark with subtle yellow
      "#fecaca": "#2a2020", // warm dark with subtle red
      "#bbf7d0": "#1e2a23", // cool dark with subtle green
      "#bfdbfe": "#1e2328", // cool dark with subtle blue
      "#e9d5ff": "#252028", // cool dark with subtle purple
      "#fbcfe8": "#2a2025", // warm dark with subtle pink
    };
    return colorMap[color] || "#1a1a1a";
  };

  // Get accent color for borders and highlights
  const getAccentColor = (color: string) => {
    const accentMap: Record<string, string> = {
      "#fef3c7": "rgba(250, 204, 21, 0.3)", // yellow
      "#fecaca": "rgba(248, 113, 113, 0.3)", // red
      "#bbf7d0": "rgba(74, 222, 128, 0.3)", // green
      "#bfdbfe": "rgba(96, 165, 250, 0.3)", // blue
      "#e9d5ff": "rgba(168, 85, 247, 0.3)", // purple
      "#fbcfe8": "rgba(236, 72, 153, 0.3)", // pink
    };
    return accentMap[color] || "rgba(255, 255, 255, 0.1)";
  };

  return (
    <>
      <div
        className={cn(
          "w-64 p-4 rounded-lg cursor-move transition-all",
          "backdrop-blur-sm",
          isDragging && "opacity-50 scale-95",
          note.isConcept &&
            "ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-[#0a0a0a] silver-border shadow-2xl",
          !note.isConcept && "shadow-lg hover:shadow-xl"
        )}
        style={{
          backgroundColor: getDarkModeColor(note.color),
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: getAccentColor(note.color),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between mb-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={toggleConcept}
            className={cn(
              "p-1.5 rounded hover:bg-white/15 transition-all",
              note.isConcept
                ? "text-yellow-400 bg-yellow-400/10"
                : "text-gray-400"
            )}
            title={note.isConcept ? "Remove from concepts" : "Mark as concept"}
          >
            <Star
              className={cn(
                "w-4 h-4",
                note.isConcept && "fill-current drop-shadow-sm"
              )}
            />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-white/15 transition-all text-gray-300 hover:text-gray-100"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded hover:bg-white/15 transition-all text-gray-300 hover:text-gray-100"
              title="Edit note"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        {note.image && (
          <div className="mb-3 relative group">
            <img
              src={note.image.dataUrl}
              alt={note.image.caption || "Note attachment"}
              className="w-full h-32 object-cover rounded cursor-pointer border border-gray-600/50 hover:border-gray-500/70 transition-colors"
              onClick={() => setShowImagePreview(true)}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-1.5 right-1.5 p-1 bg-red-500/90 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
            {note.image.caption && (
              <p className="text-xs text-gray-400 mt-1.5 italic">
                {note.image.caption}
              </p>
            )}
          </div>
        )}

        {/* Text Content */}
        {isEditing ? (
          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2.5 border border-gray-600 rounded text-sm resize-none bg-black/30 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:bg-black/40 transition-all placeholder:text-gray-500"
              rows={3}
              autoFocus
              onBlur={handleTextSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSave();
                }
              }}
            />
          </div>
        ) : (
          <p
            className="text-sm text-gray-100 whitespace-pre-wrap break-words cursor-text leading-relaxed"
            onClick={() => setIsEditing(true)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {note.text}
          </p>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && note.image && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={note.image.dataUrl}
              alt={note.image.caption || "Note attachment"}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {note.image.caption && (
              <p className="text-white text-center mt-4">
                {note.image.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
