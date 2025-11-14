'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'
import { askAI, SOCRATIC_SYSTEM_PROMPT } from '@/lib/ai-client'
import { Home, Loader2, Trophy, TrendingUp, Lightbulb, Target } from 'lucide-react'

interface ConceptEvaluation {
  noteId: string
  rank: number
  score: number
  strengths: string[]
  improvements: string[]
  feedback: string
}

export default function FinalPage() {
  const router = useRouter()
  const { state, resetSession } = useSession()
  const [evaluations, setEvaluations] = useState<ConceptEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const conceptNotes = state.notes.filter(n => n.isConcept)

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 3) {
      router.push('/canvas')
      return
    }

    evaluateConcepts()
  }, [])

  const evaluateConcepts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const conceptsText = conceptNotes
        .map((note, i) => {
          let text = `Concept ${i + 1}: ${note.text}`
          if (note.image?.caption) {
            text += `\n[Has visual reference: ${note.image.caption}]`
          }
          return text
        })
        .join('\n\n')

      const evaluationPrompt = `Project Context: ${state.hmwStatement}

Here are the student's top 3 concepts:

${conceptsText}

As a design mentor, provide a structured evaluation of each concept. For EACH concept, analyze:
1. Strengths (2-3 key strengths)
2. Areas for improvement (2-3 suggestions)
3. Overall feedback (1-2 sentences)
4. A score out of 10

Then rank them from best to least developed, explaining your reasoning briefly.

Format your response as JSON with this structure:
{
  "concepts": [
    {
      "conceptNumber": 1,
      "rank": 1,
      "score": 8.5,
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "feedback": "Overall feedback text"
    }
  ],
  "summary": "Brief summary of evaluation approach"
}`

      const response = await askAI(
        [
          {
            role: 'system',
            content: `${SOCRATIC_SYSTEM_PROMPT}\n\nFor this evaluation task, provide structured constructive feedback. Be encouraging but honest.`,
          },
          {
            role: 'user',
            content: evaluationPrompt,
          },
        ],
        0.7,
        1000
      )

      // Parse AI response
      try {
        // Extract JSON from response (in case AI adds extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found in response')
        
        const parsed = JSON.parse(jsonMatch[0])
        
        const evals: ConceptEvaluation[] = parsed.concepts.map((c: any) => ({
          noteId: conceptNotes[c.conceptNumber - 1]?.id || '',
          rank: c.rank,
          score: c.score,
          strengths: c.strengths,
          improvements: c.improvements,
          feedback: c.feedback,
        }))

        setEvaluations(evals.sort((a, b) => a.rank - b.rank))
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        // Fallback: create simple evaluations
        const fallbackEvals = conceptNotes.map((note, i) => ({
          noteId: note.id,
          rank: i + 1,
          score: 7,
          strengths: ['Shows creative thinking'],
          improvements: ['Could be more specific'],
          feedback: response.substring(0, 200),
        }))
        setEvaluations(fallbackEvals)
      }
    } catch (err) {
      console.error('Evaluation failed:', err)
      setError('Failed to get AI evaluation. Please check your LM Studio connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    if (confirm('Start a new project? This will clear all your current work.')) {
      resetSession()
      router.push('/')
    }
  }

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">AI Evaluation Results</h1>
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Start New Project
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Project:</strong> {state.hmwStatement}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg text-gray-700">AI is evaluating your concepts...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={evaluateConcepts}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((evaluation) => {
              const note = conceptNotes.find(n => n.id === evaluation.noteId)
              if (!note) return null

              const rankColors = [
                'from-yellow-400 to-orange-400',
                'from-gray-300 to-gray-400',
                'from-orange-300 to-orange-400',
              ]
              const rankIcons = [Trophy, TrendingUp, Target]
              const RankIcon = rankIcons[evaluation.rank - 1] || Target

              return (
                <div
                  key={evaluation.noteId}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  {/* Rank Header */}
                  <div
                    className={`bg-gradient-to-r ${
                      rankColors[evaluation.rank - 1]
                    } px-6 py-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <RankIcon className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="text-white font-bold text-lg">Rank #{evaluation.rank}</h3>
                        <p className="text-white/90 text-sm">Score: {evaluation.score}/10</p>
                      </div>
                    </div>
                  </div>

                  {/* Concept Content */}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex gap-4">
                        {note.image && (
                          <img
                            src={note.image.dataUrl}
                            alt={note.image.caption || 'Concept'}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Your Concept</h4>
                          <p className="text-gray-700">{note.text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Strengths */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {evaluation.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Areas to Develop
                        </h5>
                        <ul className="space-y-1">
                          {evaluation.improvements.map((improvement, i) => (
                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h5 className="font-semibold text-purple-900 mb-2">Overall Feedback</h5>
                      <p className="text-sm text-purple-800">{evaluation.feedback}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Next Steps */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Next Steps</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Review the feedback and identify patterns across your concepts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Refine your top-ranked concept based on the suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Create prototypes or sketches to test key assumptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Gather user feedback to validate your design direction</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
