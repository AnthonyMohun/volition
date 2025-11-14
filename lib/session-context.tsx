'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SessionState, INITIAL_SESSION_STATE, StickyNote, AIQuestion, Concept, ConceptEvaluation } from './types'

interface SessionContextType {
  state: SessionState
  updateHMW: (hmw: string) => void
  addNote: (note: StickyNote) => void
  updateNote: (id: string, updates: Partial<StickyNote>) => void
  deleteNote: (id: string) => void
  addQuestion: (question: AIQuestion) => void
  markQuestionAnswered: (id: string) => void
  addConcept: (concept: Concept) => void
  updateConcept: (id: string, updates: Partial<Concept>) => void
  addEvaluation: (evaluation: ConceptEvaluation) => void
  setPhase: (phase: SessionState['currentPhase']) => void
  resetSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const STORAGE_KEY = 'socratic-design-session'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL_SESSION_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setState(parsed)
        } catch (error) {
          console.error('Failed to parse session storage:', error)
        }
      }
      setIsHydrated(true)
    }
  }, [])

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isHydrated])

  const updateHMW = (hmw: string) => {
    setState(prev => ({
      ...prev,
      hmwStatement: hmw,
      projectId: prev.projectId || `proj-${Date.now()}`,
    }))
  }

  const addNote = (note: StickyNote) => {
    setState(prev => ({
      ...prev,
      notes: [...prev.notes, note],
    }))
  }

  const updateNote = (id: string, updates: Partial<StickyNote>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ),
    }))
  }

  const deleteNote = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== id),
    }))
  }

  const addQuestion = (question: AIQuestion) => {
    setState(prev => ({
      ...prev,
      questions: [...prev.questions, question],
    }))
  }

  const markQuestionAnswered = (id: string) => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === id ? { ...q, answered: true } : q
      ),
    }))
  }

  const addConcept = (concept: Concept) => {
    setState(prev => ({
      ...prev,
      concepts: [...prev.concepts, concept],
    }))
  }

  const updateConcept = (id: string, updates: Partial<Concept>) => {
    setState(prev => ({
      ...prev,
      concepts: prev.concepts.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
  }

  const addEvaluation = (evaluation: ConceptEvaluation) => {
    setState(prev => ({
      ...prev,
      evaluations: [...prev.evaluations, evaluation],
    }))
  }

  const setPhase = (phase: SessionState['currentPhase']) => {
    setState(prev => ({ ...prev, currentPhase: phase }))
  }

  const resetSession = () => {
    setState({
      ...INITIAL_SESSION_STATE,
      projectId: `proj-${Date.now()}`,
      createdAt: Date.now(),
    })
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

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
        addConcept,
        updateConcept,
        addEvaluation,
        setPhase,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
