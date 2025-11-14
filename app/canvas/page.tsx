'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'
import { DraggableNote } from '@/components/draggable-note'
import { AIQuestionPanel } from '@/components/ai-question-panel'
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { Plus, ArrowRight, Home } from 'lucide-react'
import { STICKY_COLORS } from '@/lib/types'

export default function CanvasPage() {
  const router = useRouter()
  const { state, addNote, updateNote, deleteNote, setPhase } = useSession()
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (!state.hmwStatement) {
      router.push('/')
    }
  }, [state.hmwStatement, router])

  const handleAddNote = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const x = Math.random() * (canvasRect.width - 300) + 50
    const y = Math.random() * (canvasRect.height - 200) + 50

    addNote({
      id: `note-${Date.now()}`,
      text: 'New note...',
      x,
      y,
      color: selectedColor,
      isConcept: false,
      createdAt: Date.now(),
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const noteId = active.id as string

    const note = state.notes.find(n => n.id === noteId)
    if (note) {
      updateNote(noteId, {
        x: note.x + delta.x,
        y: note.y + delta.y,
      })
    }

    setIsDragging(false)
    setDraggedNoteId(null)
  }

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setIsDragging(true)
    setDraggedNoteId(event.active.id as string)
  }

  const conceptNotes = state.notes.filter(n => n.isConcept)

  const handleProceedToReview = () => {
    if (conceptNotes.length >= 3) {
      setPhase('review')
      router.push('/review')
    }
  }

  if (!state.hmwStatement) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Ideation Canvas</h1>
            <p className="text-sm text-gray-600 max-w-2xl truncate">{state.hmwStatement}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-sm font-medium text-yellow-900">
              {conceptNotes.length} concept{conceptNotes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleProceedToReview}
            disabled={conceptNotes.length < 3}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            Review Concepts
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 relative overflow-auto" ref={canvasRef}>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="min-h-full min-w-full relative p-8">
              {state.notes.map(note => (
                <div key={note.id} style={{ position: 'absolute', left: note.x, top: note.y }}>
                  <DraggableNote
                    note={note}
                    onUpdate={(updates) => updateNote(note.id, updates)}
                    onDelete={() => deleteNote(note.id)}
                  />
                </div>
              ))}
            </div>
          </DndContext>

          {/* Floating toolbar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-4">
            <button
              onClick={handleAddNote}
              className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
              title="Add sticky note"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {STICKY_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-purple-600 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title="Select color"
                />
              ))}
            </div>
          </div>

          {state.notes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Click the + button to add your first sticky note</p>
                <p className="text-sm mt-2">Respond to the AI's questions with your ideas</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Question Panel */}
        <AIQuestionPanel />
      </div>
    </div>
  )
}
