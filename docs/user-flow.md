# User Flow

This document contains the user-flow diagram for the Socratic Design Studio app.

## Mermaid diagram

Copy the block below into a Mermaid renderer (or use VS Code Mermaid preview) to view the diagram:

```mermaid
flowchart TB
  A[Landing\n`/`]
  A --> B[Set HMW / Load Example\n`lib/example-data.ts`]
  B --> C[Canvas\n`/canvas`]
  C --> D[Create / Edit Notes\n`components/*`]
  D --> E[Session Context\n`lib/session-context.tsx`]
  E --> F[Commands & Undo/Redo\n`lib/commands.ts`]
  E --> G[AI Panel\n`components/ai-question-panel.tsx`]
  G --> H[/POST /api/ai\n`app/api/ai/route.ts`]
  H --> I[External AI Provider]
  I --> H
  H --> E
  C --> J[Select & Cluster\n`/select`]
  J --> K[Refine\n`/refine`]
  K --> L[Final\n`/final`]
  L --> E

  style A fill:#f3f4f6,stroke:#111827
  style B fill:#eef2ff,stroke:#111827
  style C fill:#fff7ed,stroke:#111827
  style D fill:#ecfccb,stroke:#111827
  style E fill:#eef2ff,stroke:#111827
  style G fill:#fef3c7,stroke:#111827
  style H fill:#fee2e2,stroke:#111827
  style I fill:#e6fffa,stroke:#111827
  style K fill:#f0f9ff,stroke:#111827
  style L fill:#fff1f2,stroke:#111827
```

## Rendered diagram

Below is a rendered SVG snapshot of the same user flow. Use it directly in documentation or open it in a browser.

![User Flow](./user-flow.svg)

---

If you'd like a different layout, a more detailed swimlane diagram, or an exported PNG instead, tell me which format and level of detail you prefer and I will update it.
