# System Diagram

This file contains a simple system diagram that explains how the app, client, and backend services interact. The diagram uses Mermaid and is meant to be easy to follow.

```mermaid
flowchart TD
  subgraph Client[Client (Browser)]
    direction TB
    Browser[User Interface (Next.js React client)]
    SessionCtx[Session Context (local state + localStorage)]
    AIClient[askAI / ai-client]
    SpeechLib[speech.ts (TTS / Web Speech)]
    Browser --> SessionCtx
    Browser --> AIClient
    Browser --> SpeechLib
  end

  subgraph NextServer[Next.js Server]
    direction TB
    API_AI[POST /api/ai]
    API_TTS[POST /api/tts]
    API_STT[POST /api/stt]
  end

  LM[LM Studio / LLM Service]
  SpeechServer[Local Speech Server (TTS/STT)]
  External[Optional External Services (e.g., file storage, analytics)]

  Browser -->|HTTP POST /api/ai| NextServer
  Browser -->|HTTP POST /api/tts| NextServer
  Browser -->|HTTP POST /api/stt| NextServer

  NextServer -->|Forward chat request| LM
  NextServer -->|Forward TTS request| SpeechServer
  NextServer -->|Forward STT request| SpeechServer

  SpeechLib -->|Web Speech API or /api/tts| Browser
  SessionCtx -->|Persist state| LocalStorage[(localStorage)]

  LM -->|AI response (JSON)| NextServer
  SpeechServer -->|Audio data / Transcript| NextServer

  click Browser "#" "Client: React + Next.js (client components)"

```

Notes (simple language):

- The app runs mostly in the browser using Next.js and React.
- When the client needs AI (e.g., next question, generate HMW), it posts to `/api/ai`.
- The Next.js API route `/api/ai` acts as a proxy and forwards the request to an LLM (LM Studio), returning the LLM response to the client.
- For text-to-speech (TTS) and speech-to-text (STT), the client calls `/api/tts` and `/api/stt`.
- The Next.js server proxies those requests to a local Speech Server (SPEECH_SERVER_URL), which returns audio files or transcripts.
- The app supports Web Speech API (client-side TTS) when available and falls back to the local TTS server.
- The user's session (notes, canvas state, selected concepts, viewport) is stored in localStorage so work can persist across sessions.
- External services (like LM Studio, speech servers, or optional file storage) sit behind the server and return data to the Next.js API routes.

This is a high-level simplified overview so it's easy to understand how data flows from the browser, through the server, and to external services.
