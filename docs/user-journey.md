# User Journey Map

This document captures the user journey through the Socratic Design Studio app: screens they visit, goals, actions they take, how the system responds, what state changes, and the main files involved.

## Overview

- Purpose: Provide a clear, actionable mapping of the user's path through the app for product, UX, and engineering reviewers.
- Scope: Landing, Canvas (ideation), AI Panel, Select & Cluster, Refine, Final, and cross-cutting flows like Undo/Redo and persistence.

---

## Landing / Home

- **User Goal:** Start a new design session or try a seeded example.
- **Actions:** Type an HMW statement; click “Try with an example”.
- **System Response:** Calls `updateHMW()` or `loadExampleSession(EXAMPLE_SESSION_DATA)`; shows success/notice toasts.
- **State Changes:** `state.hmwStatement` is set; if example is loaded, `state.notes`, `state.questions`, and `state.isExampleSession` are merged into state.
- **Files / Components:** `app/page.tsx`, `lib/example-data.ts`, `lib/session-context.tsx` (`useSession()`), `lib/toast-context.tsx`.

---

## Canvas (Ideation)

- **User Goal:** Capture, spatially arrange, and annotate ideas as sticky notes.
- **Actions:** Add new sticky notes, drag/move notes, edit text and details, attach images, delete notes.
- **System Response:** Note actions are executed (via `commands`) and reflected immediately in UI; undo/redo stacks updated; session persisted to `sessionStorage`.
- **State Changes:** `state.notes` updated; command stacks (`undoStack`, `redoStack`) changed; `viewport` may update with pan/zoom.
- **Files / Components:** `app/canvas/page.tsx`, `components/draggable-note.tsx`, `components/sticky-note.tsx`, `components/canvas-grid.tsx`, `components/canvas-controls.tsx`, `lib/commands.ts`, `lib/session-context.tsx`.

---

## AI Panel / Questioning

- **User Goal:** Generate ideation prompts, ask for critiques, or request refinements from the AI.
- **Actions:** Open AI panel, select a suggested prompt or type a custom question, submit.
- **System Response:** Adds the question locally (`addQuestion`), sends a POST to `/api/ai` (`app/api/ai/route.ts`); server calls external AI through `lib/ai-client.ts`. Responses are returned and applied (e.g., adding notes, editing content) and question marked answered.
- **State Changes:** `state.questions` appended/updated; `state.notes` and `state.evaluations` may be updated based on AI output.
- **Files / Components:** `components/ai-question-panel.tsx`, `app/api/ai/route.ts`, `lib/ai-client.ts`, `lib/session-context.tsx`.

---

## Select & Cluster

- **User Goal:** Group related notes into candidate concepts to prepare for refinement.
- **Actions:** Multi-select notes on the canvas, create concept(s), assign note IDs to concepts, allocate tokens/priorities.
- **System Response:** Adds / updates `Concept` objects; selected concept IDs and token allocation are stored; UI shows concept cards/lists.
- **State Changes:** `state.concepts`, `state.selectedConceptIds`, `state.tokenAllocation` updated.
- **Files / Components:** `app/select/page.tsx`, `lib/session-context.tsx`, `components/canvas-controls.tsx`.

---

## Refine

- **User Goal:** Iterate on chosen concepts using AI feedback and manual edits to produce better, evaluated concepts.
- **Actions:** Send selected concepts to AI, read AI evaluations and reasons, accept or edit AI suggestions, add human evaluation notes.
- **System Response:** AI evaluations stored via `addEvaluation()`; UI surfaces scores and reasons; if user accepts edits, `updateConcept()` and/or `updateNote()` modify state.
- **State Changes:** `state.evaluations`, `state.concepts`, and possibly `state.notes` updated.
- **Files / Components:** `app/refine/page.tsx`, `lib/ai-client.ts`, `app/api/ai/route.ts`, `lib/session-context.tsx`.

---

## Final / Export

- **User Goal:** Review final refined concepts, prepare a deliverable or export summary, or start a new session.
- **Actions:** View final concept list or summary, copy or download export, reset session or start new project.
- **System Response:** Renders aggregated session data; `resetSession()` clears state and sessionStorage if user chooses to reset.
- **State Changes:** None by default, unless user resets — `resetSession()` returns `INITIAL_SESSION_STATE` and clears persistence and command stacks.
- **Files / Components:** `app/final/page.tsx`, `lib/session-context.tsx`.

---

## Cross-cutting Flows

- **Undo / Redo**

  - When: After note create/update/delete or other command-based actions.
  - How: Actions are wrapped in `ICommand` implementations (`lib/commands.ts`). `pushCommand()` executes and pushes commands to `undoStack`; `undo()` and `redo()` pop/push stacks and call `.undo()` / `.execute()` on commands.
  - Feedback: Toast messages via `lib/toast-context.tsx` confirm action reversal.

- **Persistence**

  - When: After state changes, once the provider is hydrated.
  - Where: Browser `sessionStorage` under key `socratic-design-session` (client-only persistence).
  - Note: Sessions are per-browser tab/window and not persisted server-side.

- **Example Sessions**

  - Trigger: User clicks the example button on Landing.
  - Effect: `EXAMPLE_SESSION_DATA` from `lib/example-data.ts` is merged into the session and `isExampleSession` is set to `true`.

- **AI Errors**
  - When: External AI or server API fails.
  - System: Server route returns an error; UI should show a toast and avoid applying partial changes. Files involved: `app/api/ai/route.ts`, `lib/ai-client.ts`, `lib/toast-context.tsx`.

---

## UX Opportunities & Recommendations

- Add explicit “export / save to account” so users can persist sessions beyond `sessionStorage`.
- Add confirmation flows for destructive actions: delete note, reset session.
- Improve AI feedback UI: show request progress, allow canceling long-running queries, and show confidence/traceability for AI edits.
- Visual indicator for example sessions so users can see the session is seeded and not their own work.

---

If you want this journey map merged into another docs file or expanded to a swimlane diagram (Mermaid) or QA checklist, tell me where and I'll update it.
