"use client";

import {
  Zap,
  Brain,
  Sparkles,
  Check,
  Settings,
  Flag,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface JourneyStage {
  id: string;
  name: string;
  title: string;
  icon: React.ReactNode;
  goal: string;
  actions: string[];
  systemResponse: string;
  stateChanges: string[];
  files: string[];
  color: string;
  accentColor: string;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "landing",
    name: "Landing / Home",
    title: "Start Your Session",
    icon: <Flag className="w-5 h-5" />,
    goal: "Start a new design session or try a seeded example.",
    actions: ["Type an HMW statement", "Click 'Try with an example'"],
    systemResponse:
      "Calls updateHMW() or loadExampleSession(); shows success/notice toasts.",
    stateChanges: [
      "state.hmwStatement is set",
      "If example loaded: state.notes, state.questions, state.isExampleSession merged",
    ],
    files: [
      "app/page.tsx",
      "lib/example-data.ts",
      "lib/session-context.tsx",
      "lib/toast-context.tsx",
    ],
    color: "from-emerald-600 to-teal-600",
    accentColor: "text-emerald-400",
  },
  {
    id: "canvas",
    name: "Canvas (Ideation)",
    title: "Capture & Arrange Ideas",
    icon: <Sparkles className="w-5 h-5" />,
    goal: "Capture, spatially arrange, and annotate ideas as sticky notes.",
    actions: [
      "Add new sticky notes",
      "Drag/move notes",
      "Edit text and details",
      "Attach images",
      "Delete notes",
    ],
    systemResponse:
      "Note actions executed via commands; reflected immediately in UI; undo/redo stacks updated; session persisted to sessionStorage.",
    stateChanges: [
      "state.notes updated",
      "command stacks (undoStack, redoStack) changed",
      "viewport may update with pan/zoom",
    ],
    files: [
      "app/canvas/page.tsx",
      "components/draggable-note.tsx",
      "components/sticky-note.tsx",
      "components/canvas-grid.tsx",
      "components/canvas-controls.tsx",
      "lib/commands.ts",
      "lib/session-context.tsx",
    ],
    color: "from-purple-600 to-pink-600",
    accentColor: "text-purple-400",
  },
  {
    id: "ai-panel",
    name: "AI Panel / Questioning",
    title: "Get AI Insights",
    icon: <Brain className="w-5 h-5" />,
    goal: "Generate ideation prompts, ask for critiques, or request refinements from the AI.",
    actions: [
      "Open AI panel",
      "Select a suggested prompt or type custom question",
      "Submit query",
    ],
    systemResponse:
      "Adds question locally via addQuestion(); sends POST to /api/ai; server calls external AI through lib/ai-client.ts; responses applied and question marked answered.",
    stateChanges: [
      "state.questions appended/updated",
      "state.notes and state.evaluations may be updated based on AI output",
    ],
    files: [
      "components/ai-question-panel.tsx",
      "app/api/ai/route.ts",
      "lib/ai-client.ts",
      "lib/session-context.tsx",
    ],
    color: "from-blue-600 to-cyan-600",
    accentColor: "text-blue-400",
  },
  {
    id: "select",
    name: "Select & Cluster",
    title: "Group Concepts",
    icon: <Zap className="w-5 h-5" />,
    goal: "Group related notes into candidate concepts to prepare for refinement.",
    actions: [
      "Multi-select notes on canvas",
      "Create concept(s)",
      "Assign note IDs to concepts",
    ],
    systemResponse:
      "Adds/updates Concept objects; selected concept IDs stored; UI shows concept cards/lists.",
    stateChanges: [
      "state.concepts updated",
      "state.selectedConceptIds updated",
    ],
    files: [
      "app/select/page.tsx",
      "lib/session-context.tsx",
      "components/canvas-controls.tsx",
    ],
    color: "from-amber-600 to-orange-600",
    accentColor: "text-amber-400",
  },
  {
    id: "refine",
    name: "Refine",
    title: "Iterate & Improve",
    icon: <Settings className="w-5 h-5" />,
    goal: "Iterate on chosen concepts using AI feedback and manual edits.",
    actions: [
      "Send selected concepts to AI",
      "Read AI evaluations and reasons",
      "Accept or edit AI suggestions",
      "Add human evaluation notes",
    ],
    systemResponse:
      "AI evaluations stored via addEvaluation(); UI surfaces scores and reasons; if user accepts edits, updateConcept() and/or updateNote() modify state.",
    stateChanges: [
      "state.evaluations updated",
      "state.concepts and possibly state.notes updated",
    ],
    files: [
      "app/refine/page.tsx",
      "lib/ai-client.ts",
      "app/api/ai/route.ts",
      "lib/session-context.tsx",
    ],
    color: "from-rose-600 to-red-600",
    accentColor: "text-rose-400",
  },
  {
    id: "final",
    name: "Final / Export",
    title: "Review & Export",
    icon: <Check className="w-5 h-5" />,
    goal: "Review final refined concepts, prepare a deliverable or export summary.",
    actions: [
      "View final concept list or summary",
      "Copy or download export",
      "Reset session or start new project",
    ],
    systemResponse:
      "Renders aggregated session data; resetSession() clears state and sessionStorage if user chooses to reset.",
    stateChanges: [
      "None by default, unless user resets",
      "resetSession() returns INITIAL_SESSION_STATE and clears persistence",
    ],
    files: ["app/final/page.tsx", "lib/session-context.tsx"],
    color: "from-indigo-600 to-purple-600",
    accentColor: "text-indigo-400",
  },
];

const CROSS_CUTTING = [
  {
    title: "Undo / Redo",
    description:
      "After note create/update/delete or other command-based actions.",
    details:
      "Actions wrapped in ICommand implementations. pushCommand() executes and pushes commands to undoStack; undo() and redo() pop/push stacks.",
    files: [
      "lib/commands.ts",
      "lib/session-context.tsx",
      "lib/toast-context.tsx",
    ],
  },
  {
    title: "Persistence",
    description: "After state changes, once the provider is hydrated.",
    details:
      "Browser sessionStorage under key 'socratic-design-session' (client-only persistence). Sessions are per-browser tab/window.",
    files: ["lib/session-context.tsx"],
  },
  {
    title: "Example Sessions",
    description: "Trigger: User clicks the example button on Landing.",
    details:
      "EXAMPLE_SESSION_DATA from lib/example-data.ts is merged into the session and isExampleSession is set to true.",
    files: ["lib/example-data.ts", "lib/session-context.tsx"],
  },
  {
    title: "AI Errors",
    description: "When: External AI or server API fails.",
    details:
      "Server route returns an error; UI shows a toast and avoids applying partial changes.",
    files: ["app/api/ai/route.ts", "lib/ai-client.ts", "lib/toast-context.tsx"],
  },
];

function StageCard({
  stage,
  stageNumber,
}: {
  stage: JourneyStage;
  stageNumber: number;
}) {
  return (
    <div className="flex-shrink-0 w-80">
      <motion.div layout className="h-full flex flex-col">
        {/* Stage Number Badge */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${stage.color} flex items-center justify-center text-white font-bold text-sm`}
          >
            {stageNumber}
          </div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            {stage.name}
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all flex-1 flex flex-col">
          {/* Header */}
          <div
            className={`bg-gradient-to-r ${stage.color} p-0.5 rounded-t-2xl`}
          >
            <div className="bg-[#0a0a0a] p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg bg-gradient-to-br ${stage.color} text-white flex-shrink-0`}
                >
                  {stage.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-100 text-base leading-tight">
                    {stage.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Goal - Always Visible */}
          <div className="p-5 border-b border-gray-700/50">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Goal
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {stage.goal}
            </p>
          </div>

          {/* Details */}
          <div className="p-5 space-y-5 border-t border-gray-700/50">
            {/* Actions */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                Actions
              </div>
              <div className="space-y-2">
                {stage.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className={`w-1 h-1 rounded-full ${stage.accentColor} mt-1.5 flex-shrink-0`}
                    />
                    <span className="text-xs text-gray-400 leading-relaxed">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Response */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                System Response
              </div>
              <p className="text-xs text-gray-400 bg-gray-900/30 rounded-lg p-3 border border-gray-800/50 leading-relaxed">
                {stage.systemResponse}
              </p>
            </div>

            {/* State Changes */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                State Changes
              </div>
              <div className="space-y-1.5">
                {stage.stateChanges.map((change, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-400 bg-gray-900/30 rounded-lg p-2.5 border border-gray-800/50 flex items-start gap-2"
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${stage.accentColor} mt-1.5 flex-shrink-0`}
                    />
                    <span className="leading-relaxed">{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Files */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Files
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stage.files.map((file, i) => (
                  <code
                    key={i}
                    className="text-[10px] px-2 py-1 rounded bg-gray-900/50 border border-gray-800/50 text-gray-400 font-mono"
                  >
                    {file}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function JourneyPage() {
  return (
    <div className="min-h-screen dark-gradient-radial texture-overlay">
      {/* Header */}
      <div className="text-center py-12 px-4">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
          User Journey Map
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Explore the complete user experience through Socratic Design Studio
        </p>
      </div>

      {/* Horizontal Scrollable Journey */}
      <div className="px-4 pb-12">
        <div className="relative">
          {/* Timeline Line */}
          <div
            className="absolute top-14 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-purple-500 via-blue-500 via-amber-500 via-rose-500 to-indigo-500 opacity-30 z-0"
            style={{ width: "calc(100% - 2rem)", marginLeft: "1rem" }}
          />

          {/* Stages Container */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 px-4 relative z-10">
              {JOURNEY_STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-start">
                  <StageCard stage={stage} stageNumber={index + 1} />
                  {index < JOURNEY_STAGES.length - 1 && (
                    <div className="flex items-center justify-center pt-20 px-2 flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Cutting Flows & Additional Info */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Cross-Cutting Flows */}
        <div className="mt-12 pt-12 border-t border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Cross-Cutting Flows
          </h2>
          <p className="text-gray-400 mb-8">
            These flows operate across multiple stages and are essential to the
            user experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CROSS_CUTTING.map((flow, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  {flow.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{flow.description}</p>
                <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-800/50 mb-4">
                  <p className="text-sm text-gray-300">{flow.details}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Files
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {flow.files.map((file, j) => (
                      <code
                        key={j}
                        className="text-xs px-2 py-1 rounded bg-gray-900/50 border border-gray-800/50 text-gray-300 font-mono"
                      >
                        {file}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UX Opportunities */}
        <div className="mt-16 pt-12 border-t border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            UX Opportunities & Recommendations
          </h2>

          <div className="space-y-4">
            {[
              "Add explicit 'export / save to account' so users can persist sessions beyond sessionStorage",
              "Add confirmation flows for destructive actions: delete note, reset session",
              "Improve AI feedback UI: show request progress, allow canceling long-running queries, show confidence/traceability for AI edits",
              "Visual indicator for example sessions so users can see the session is seeded and not their own work",
            ].map((rec, i) => (
              <div
                key={i}
                className="glass rounded-xl p-4 border border-gray-700/50 flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <p className="text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>This journey map guides product, UX, and engineering decisions</p>
        </div>
      </div>
    </div>
  );
}
