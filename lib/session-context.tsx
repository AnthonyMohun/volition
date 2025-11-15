"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./toast-context";
import {
  ICommand,
  AddNoteCommand,
  DeleteNoteCommand,
  UpdateNoteCommand,
} from "./commands";
import {
  SessionState,
  INITIAL_SESSION_STATE,
  StickyNote,
  AIQuestion,
  Concept,
  ConceptEvaluation,
} from "./types";

interface SessionContextType {
  state: SessionState;
  updateHMW: (hmw: string) => void;
  addNote: (note: StickyNote) => void;
  updateNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
  addQuestion: (question: AIQuestion) => void;
  markQuestionAnswered: (id: string) => void;
  toggleQuestionAnswered: (id: string) => void;
  toggleQuestionPinned: (id: string) => void;
  addConcept: (concept: Concept) => void;
  updateConcept: (id: string, updates: Partial<Concept>) => void;
  addEvaluation: (evaluation: ConceptEvaluation) => void;
  setPhase: (phase: SessionState["currentPhase"]) => void;
  setSelectedConcepts: (
    conceptIds: string[],
    tokenAllocation: Record<string, number>
  ) => void;
  resetSession: () => void;
  loadExampleSession: (exampleState: Partial<SessionState>) => void;
  clearExampleSessionFlag: () => void;
  // viewport setter: center X/Y in world coords and zoom
  setViewport: (v: { centerX: number; centerY: number; zoom: number }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const STORAGE_KEY = "socratic-design-session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL_SESSION_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const { showToast } = useToast();

  // Command stacks used for undo/redo
  const [undoStack, setUndoStack] = useState<ICommand[]>([]);
  const [redoStack, setRedoStack] = useState<ICommand[]>([]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const pushCommand = (cmd: ICommand) => {
    // Execute the command and push it to undo stack, clear redo
    cmd.execute(setState);
    setUndoStack((prev) => [...prev, cmd]);
    setRedoStack([]);
  };

  const undo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    last.undo(setState);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    showToast(last.label ? `Undid: ${last.label}` : "Undid action");
  };

  const redo = () => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;
    last.execute(setState);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, last]);
    showToast(last.label ? `Redid: ${last.label}` : "Redid action");
  };

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setState(parsed);
        } catch (error) {
          console.error("Failed to parse session storage:", error);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const updateHMW = (hmw: string) => {
    setState((prev) => ({
      ...prev,
      hmwStatement: hmw,
      projectId: prev.projectId || `proj-${Date.now()}`,
    }));
  };

  const addNote = (note: StickyNote) => {
    pushCommand(new AddNoteCommand(note));
  };

  const updateNote = (id: string, updates: Partial<StickyNote>) => {
    const prevNote = state.notes.find((n) => n.id === id);
    if (!prevNote) return;
    const nextNote: StickyNote = { ...prevNote, ...updates };
    pushCommand(new UpdateNoteCommand(prevNote, nextNote));
  };

  const deleteNote = (id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (!note) return;
    pushCommand(new DeleteNoteCommand(note));
  };

  const addQuestion = (question: AIQuestion) => {
    setState((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...question, pinned: false }],
    }));
  };

  const markQuestionAnswered = (id: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, answered: true } : q
      ),
    }));
  };

  const toggleQuestionAnswered = (id: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, answered: !q.answered } : q
      ),
    }));
  };

  const toggleQuestionPinned = (id: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, pinned: !q.pinned } : q
      ),
    }));
  };

  const addConcept = (concept: Concept) => {
    setState((prev) => ({
      ...prev,
      concepts: [...prev.concepts, concept],
    }));
  };

  const updateConcept = (id: string, updates: Partial<Concept>) => {
    setState((prev) => ({
      ...prev,
      concepts: prev.concepts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const addEvaluation = (evaluation: ConceptEvaluation) => {
    setState((prev) => ({
      ...prev,
      evaluations: [...prev.evaluations, evaluation],
    }));
  };

  const setPhase = (phase: SessionState["currentPhase"]) => {
    setState((prev) => ({ ...prev, currentPhase: phase }));
  };

  const setSelectedConcepts = (
    conceptIds: string[],
    tokenAllocation: Record<string, number>
  ) => {
    setState((prev) => ({
      ...prev,
      selectedConceptIds: conceptIds,
      tokenAllocation,
    }));
  };

  const resetSession = () => {
    setState({
      ...INITIAL_SESSION_STATE,
      projectId: `proj-${Date.now()}`,
      createdAt: Date.now(),
    });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setUndoStack([]);
    setRedoStack([]);
  };

  const loadExampleSession = (exampleState: Partial<SessionState>) => {
    setState((prev) => ({
      ...prev,
      ...exampleState,
      projectId: `proj-${Date.now()}`,
      createdAt: Date.now(),
      isExampleSession: true,
    }));
    setUndoStack([]);
    setRedoStack([]);
  };

  const clearExampleSessionFlag = () => {
    setState((prev) => ({ ...prev, isExampleSession: false }));
  };

  const setViewport = (v: {
    centerX: number;
    centerY: number;
    zoom: number;
  }) => {
    setState((prev) => ({
      ...prev,
      viewport: { centerX: v.centerX, centerY: v.centerY, zoom: v.zoom },
    }));
  };

  return (
    <SessionContext.Provider
      value={{
        state,
        updateHMW,
        addNote,
        updateNote,
        deleteNote,
        addQuestion,
        markQuestionAnswered,
        toggleQuestionAnswered,
        toggleQuestionPinned,
        addConcept,
        updateConcept,
        addEvaluation,
        setPhase,
        setSelectedConcepts,
        resetSession,
        loadExampleSession,
        clearExampleSessionFlag,
        setViewport,
        undo,
        redo,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
