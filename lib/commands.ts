import { SessionState, StickyNote } from "./types";

export interface ICommand {
  label?: string;
  execute: (
    setState: (fn: (prev: SessionState) => SessionState) => void
  ) => void;
  undo: (setState: (fn: (prev: SessionState) => SessionState) => void) => void;
}

export class AddNoteCommand implements ICommand {
  label?: string;
  note: StickyNote;
  constructor(note: StickyNote) {
    this.note = note;
    this.label = "Add note";
  }
  execute(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({ ...prev, notes: [...prev.notes, this.note] }));
  }
  undo(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== this.note.id),
    }));
  }
}

export class DeleteNoteCommand implements ICommand {
  label?: string;
  note: StickyNote;
  constructor(note: StickyNote) {
    this.note = note;
    this.label = "Delete note";
  }
  execute(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== this.note.id),
    }));
  }
  undo(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({ ...prev, notes: [...prev.notes, this.note] }));
  }
}

export class UpdateNoteCommand implements ICommand {
  label?: string;
  id: string;
  prev: StickyNote;
  next: StickyNote;
  constructor(prev: StickyNote, next: StickyNote) {
    this.id = prev.id;
    this.prev = prev;
    this.next = next;
    // Choose a friendly label for the undo/redo toast based on changes
    const changedKeys = Object.keys(next).filter((k) => {
      // @ts-ignore
      return (
        JSON.stringify((prev as any)[k]) !== JSON.stringify((next as any)[k])
      );
    });
    if (
      changedKeys.length === 1 &&
      (changedKeys.includes("x") || changedKeys.includes("y"))
    ) {
      this.label = "Move note";
    } else if (changedKeys.includes("text")) {
      this.label = "Edit note";
    } else if (changedKeys.includes("color")) {
      this.label = "Change note color";
    } else {
      this.label = "Update note";
    }
  }
  execute(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === this.id ? this.next : n)),
    }));
  }
  undo(setState: (fn: (prev: SessionState) => SessionState) => void) {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === this.id ? this.prev : n)),
    }));
  }
}
