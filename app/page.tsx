'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session-context'
import { Lightbulb, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { updateHMW, setPhase } = useSession()
  const [hmwInput, setHmwInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hmwInput.trim()) {
      updateHMW(hmwInput.trim())
      setPhase('canvas')
      router.push('/canvas')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lightbulb className="w-12 h-12 text-purple-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Socratic Design Studio
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover concepts through guided exploration
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-start gap-3 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-purple-900 mb-1">
                Start with a "How Might We" statement
              </h2>
              <p className="text-sm text-purple-700">
                Frame your design challenge as an open-ended question. This helps focus your ideation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="hmw" className="block text-sm font-medium text-gray-700 mb-2">
                Your Design Challenge
              </label>
              <textarea
                id="hmw"
                value={hmwInput}
                onChange={(e) => setHmwInput(e.target.value)}
                placeholder="How might we help students manage their time more effectively?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!hmwInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              Begin Exploration
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 text-sm">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Answer guided questions with sticky notes</li>
              <li>• Attach images to your notes for richer ideas</li>
              <li>• Mark promising ideas as concepts</li>
              <li>• Self-evaluate and refine your top concepts</li>
              <li>• Get AI feedback on your final designs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
