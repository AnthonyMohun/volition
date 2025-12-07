# Site Map

This file contains a simple site map showing the main pages and navigation flow for the app (Mermaid diagram + short description).

```mermaid
graph LR
  A[Home /] --> B[Canvas /canvas]
  A --> C[HMW builder (modal) -- embedded on Home]
  B --> D[Refine /refine]
  B --> E[Select /select]
  B --> F[Review /review]
  B --> G[Final /final]
  B --> H[Presentation /presentation]
  A --> I[Persona /persona]
  A --> J[Journey /journey]
  G --> H
  H --> H1[Slides: CoverSlide, DemoSlide, etc.]

  subgraph ServerAPI[Server API]
    K1[/api/ai]
    K2[/api/tts]
    K3[/api/stt]
  end

  Browser -.-> K1
  Browser -.-> K2
  Browser -.-> K3

  style A fill:#F9FAFB,stroke:#111,stroke-width:1px
  style B fill:#E6FFFA,stroke:#111
  style G fill:#fff6e6,stroke:#111
  style H fill:#eef2ff,stroke:#111

```

Simple site map notes:

- Home (`/`) is the landing page where users define the 'How Might We' challenge. The AI HMW Builder is a modal that can guide users.
- Canvas (`/canvas`) is the primary workspace where users capture notes, arrange and connect ideas, use voice input, and interact with AI suggestions.
- From the canvas, users refine notes (`/refine`), pick which ideas to develop further (`/select`), review their work (`/review`), and complete an evaluation flow (`/final`).
- The presentation page (`/presentation`) shows a structured slideshow for artifacts and exports; its slides are componentized under `app/presentation/slides`.
- The persona and journey pages provide extra templates or context the user can reference while ideating (`/persona`, `/journey`).
- API endpoints the client uses include `POST /api/ai`, `POST /api/tts`, and `POST /api/stt` (these proxy to LM and a local Speech Server).

This map focuses on the user-facing routes and the main API interactions used by the front-end.
