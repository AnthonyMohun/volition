'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'
import { ArrowRight, ArrowLeft, Star, CheckCircle2 } from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const { state, setPhase } = useSession()
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
  const [tokenAllocation, setTokenAllocation] = useState<Record<string, number>>({})

  const conceptNotes = state.notes.filter(n => n.isConcept)
  const totalTokens = 10

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 3) {
      router.push('/canvas')
    }
  }, [state.hmwStatement, conceptNotes.length, router])

  const toggleConceptSelection = (noteId: string) => {
    setSelectedConcepts(prev => {
      if (prev.includes(noteId)) {
        const newTokens = { ...tokenAllocation }
        delete newTokens[noteId]
        setTokenAllocation(newTokens)
        return prev.filter(id => id !== noteId)
      } else if (prev.length < 3) {
        return [...prev, noteId]
      }
      return prev
    })
  }

  const allocateToken = (noteId: string, amount: number) => {
    const current = tokenAllocation[noteId] || 0
    const newAmount = Math.max(0, Math.min(totalTokens, current + amount))
    
    const otherTotal = Object.entries(tokenAllocation)
      .filter(([id]) => id !== noteId)
      .reduce((sum, [, val]) => sum + val, 0)
    
    if (otherTotal + newAmount <= totalTokens) {
      setTokenAllocation({ ...tokenAllocation, [noteId]: newAmount })
    }
  }

  const allocatedTokens = Object.values(tokenAllocation).reduce((sum, val) => sum + val, 0)

  const handleProceedToFinal = () => {
    if (selectedConcepts.length === 3 && allocatedTokens === totalTokens) {
      setPhase('final')
      router.push('/final')
    }
  }

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null
  }

  return (
    <div className="min-h-screen dark-gradient-radial texture-overlay p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/canvas')}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Canvas
          </button>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Review Your Concepts</h1>
          <p className="text-gray-400">Select your top 3 concepts and allocate tokens to evaluate them</p>
        </div>

        {/* Selection Step */}
        <div className="glass rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Step 1: Select Top 3 Concepts</h2>
              <p className="text-sm text-gray-400 mt-1">
                Click on concepts to select ({selectedConcepts.length}/3 selected)
              </p>
            </div>
            {selectedConcepts.length === 3 && (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conceptNotes.map(note => {
              const isSelected = selectedConcepts.includes(note.id)
              const getDarkenedColor = (color: string) => {
                const colorMap: Record<string, string> = {
                  '#fef3c7': '#3a3420',
                  '#fecaca': '#3a2020',
                  '#bbf7d0': '#1e3a28',
                  '#bfdbfe': '#1e2a3a',
                  '#e9d5ff': '#2d1e3a',
                  '#fbcfe8': '#3a1e30',
                }
                return colorMap[color] || color
              }
              
              return (
                <button
                  key={note.id}
                  onClick={() => toggleConceptSelection(note.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 glass shadow-lg shadow-purple-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: isSelected ? undefined : getDarkenedColor(note.color) }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Star className={`w-5 h-5 ${isSelected ? 'text-purple-400 fill-current' : 'text-yellow-400'}`} />
                    {isSelected && (
                      <span className="text-xs font-semibold text-purple-300 glass-light px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  {note.image && (
                    <img
                      src={note.image.dataUrl}
                      alt={note.image.caption || 'Concept'}
                      className="w-full h-24 object-cover rounded mb-2 border border-gray-700/50"
                    />
                  )}
                  <p className="text-sm text-gray-200 line-clamp-3">{note.text}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Token Allocation Step */}
        {selectedConcepts.length === 3 && (
          <div className="glass rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-100">Step 2: Allocate Tokens</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Distribute {totalTokens} tokens among your top 3 concepts based on feasibility, innovation, and impact
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{allocatedTokens}/{totalTokens}</div>
                <div className="text-xs text-gray-500">tokens used</div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedConcepts.map(noteId => {
                const note = conceptNotes.find(n => n.id === noteId)
                if (!note) return null
                const tokens = tokenAllocation[noteId] || 0

                return (
                  <div key={noteId} className="p-4 glass-light rounded-lg border border-gray-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 font-medium mb-1">{note.text}</p>
                        {note.image?.caption && (
                          <p className="text-xs text-gray-500">{note.image.caption}</p>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-purple-400 ml-4">{tokens}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => allocateToken(noteId, -1)}
                        disabled={tokens === 0}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium text-gray-200 transition-colors"
                      >
                        −
                      </button>
                      <div className="flex-1 h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${(tokens / totalTokens) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() => allocateToken(noteId, 1)}
                        disabled={allocatedTokens >= totalTokens}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Proceed Button */}
        <div className="flex justify-end">
          <button
            onClick={handleProceedToFinal}
            disabled={selectedConcepts.length !== 3 || allocatedTokens !== totalTokens}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg silver-glow"
          >
            Get AI Evaluation
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
