"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { StickyNote } from "./sticky-note";
import { StickyNote as StickyNoteType } from "@/lib/types";

interface DraggableNoteProps {
  note: StickyNoteType;
  onUpdate: (updates: Partial<StickyNoteType>) => void;
  onDelete: () => void;
}

export function DraggableNote({
  note,
  onUpdate,
  onDelete,
}: DraggableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: note.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <StickyNote
        note={note}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}
