"use client";

import {
  User,
  Target,
  AlertCircle,
  Activity,
  Zap,
  Monitor,
} from "lucide-react";

export default function PersonaPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-6 silver-glow">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            User Persona
          </h1>
          <p className="text-gray-400 text-lg">
            Understanding our primary user
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Age & Role */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Age / Role
                </h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-100 mb-2">21</p>
            <p className="text-gray-300 text-lg">
              3rd-year Interaction Design student
            </p>
          </div>

          {/* Goal */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">Goal</h3>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Confidently generate thoughtful, high-quality concepts for college
              projects
            </p>
          </div>

          {/* Frustration */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Frustration
                </h3>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Feels stuck, overwhelmed by scattered ideas, and unsure if their
              concepts are strong enough
            </p>
          </div>

          {/* Behavior */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Behavior
                </h3>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Spends long hours sketching, researching, and iterating; seeks
              tools that guide rather than dictate
            </p>
          </div>
        </div>

        {/* Full Width Cards */}
        <div className="grid grid-cols-1 gap-6">
          {/* Motivation */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border-animated">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Motivation
                </h3>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              Wants to create work they're proud of and that stands alongside
              the best in their class
            </p>
          </div>

          {/* Tech Comfort */}
          <div className="glass rounded-2xl p-6 border border-gray-700/50 silver-border-animated">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  Tech Comfort
                </h3>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              Highly comfortable with digital tools and apps; values intuitive,
              supportive, and minimalist interfaces
            </p>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mt-8 glass rounded-2xl p-8 border border-gray-700/50 text-center">
          <blockquote className="text-2xl font-light text-gray-300 italic leading-relaxed">
            "I want a tool that helps me think deeper,
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
              not one that thinks for me
            </span>
            ."
          </blockquote>
        </div>
      </div>
    </div>
  );
}
