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
    <div className="min-h-screen dark-gradient-radial texture-overlay flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lightbulb className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Socratic Design Studio
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Discover concepts through guided exploration
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-gray-700/50">
          <div className="flex items-start gap-3 mb-6 p-4 glass-light rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-100 mb-1">
                Start with a "How Might We" statement
              </h2>
              <p className="text-sm text-gray-400">
                Frame your design challenge as an open-ended question. This helps focus your ideation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="hmw" className="block text-sm font-medium text-gray-300 mb-2">
                Your Design Challenge
              </label>
              <textarea
                id="hmw"
                value={hmwInput}
                onChange={(e) => setHmwInput(e.target.value)}
                placeholder="How might we help students manage their time more effectively?"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-100 placeholder:text-gray-500 transition-all"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!hmwInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 hover:shadow-xl silver-glow"
            >
              Begin Exploration
            </button>
          </form>

          <div className="mt-6 p-4 glass-light rounded-lg border border-gray-700/50">
            <h3 className="font-medium text-gray-200 mb-2 text-sm">What happens next?</h3>
            <ul className="text-sm text-gray-400 space-y-1">
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
