# Socratic Design Studio

An AI-powered interaction design ideation tool that uses Socratic learning methods to help students develop concepts through guided exploration.

## Features

- **How Might We Statement**: Start with a clear design challenge
- **Interactive Canvas**: Create and organize sticky notes with drag-and-drop
- **Image Attachments**: Add visual references to your notes
- **AI Socratic Questioning**: Get guided questions from a local AI model
- **Concept Development**: Mark promising ideas as concepts
- **Self-Evaluation**: Select top 3 concepts and allocate tokens
- **AI Evaluation**: Receive structured feedback and rankings from AI
- **AI Evaluation (strict)**: Receive structured feedback and rankings from AI. Incomplete or title-only concepts are now penalized and will receive lower scores to encourage clearer descriptions.
- **Session Persistence**: Work is saved in browser session storage

## Prerequisites

- Node.js 18+ installed
- [LM Studio](https://lmstudio.ai/) running locally with a model loaded
- A local AI model capable of following instructions (e.g., Llama, Mistral, etc.)

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure LM Studio**:

   - Install and open LM Studio
   - Download and load a model (recommended: Llama 3.1 8B or similar)
   - Start the local server (default: http://127.0.0.1:1234)
   - Note: The app uses the `/v1/chat/completions` endpoint

3. **Configure environment variables**:
   Edit `.env.local` if needed:

   ```bash
   LMSTUDIO_URL=http://127.0.0.1:1234
   LMSTUDIO_INFER_PATH=/v1/chat/completions
   LMSTUDIO_MODEL=
   ```

   - Leave `LMSTUDIO_MODEL` empty to use the default model loaded in LM Studio
   - Or specify a model name if LM Studio requires it

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Flow

### 1. How Might We Statement

- Enter your design challenge as a "How Might We" question
- Example: "How might we help students manage their time more effectively?"

### 2. Ideation Canvas

- AI asks you an opening Socratic question
- Add sticky notes to respond to questions
- Attach images to notes for visual references
- Mark promising notes as concepts (star icon)
- Request next question when ready

### 3. Review Concepts

- Once you have 3+ concepts, proceed to review
- Select your top 3 concepts
- Allocate 10 tokens across them (based on feasibility, innovation, impact)

### 4. Final Evaluation

- AI evaluates and ranks your concepts
- Review strengths, improvements, and overall feedback
- Get actionable next steps

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS
- **Drag & Drop**: @dnd-kit
- **State Management**: React Context + sessionStorage
- **AI Integration**: LM Studio local API
- **Icons**: Lucide React

## Project Structure

```
socratic-design-app/
├── app/
│   ├── page.tsx              # HMW landing page
│   ├── canvas/page.tsx       # Main ideation canvas
│   ├── review/page.tsx       # Concept selection & evaluation
│   ├── final/page.tsx        # AI evaluation results
│   └── api/ai/route.ts       # LM Studio proxy API
├── components/
│   ├── sticky-note.tsx       # Draggable sticky note component
│   └── ai-question-panel.tsx # AI question sidebar
├── lib/
│   ├── session-context.tsx   # Session state management
│   ├── types.ts              # TypeScript types
│   ├── ai-client.ts          # AI communication utilities
│   └── utils.ts              # Helper functions
└── .env.local                # Environment configuration
```

## Features Detail

### Sticky Notes

- Create, edit, delete notes
- Drag and drop to organize
- 6 color options
- Image attachments with compression
- Mark as concept

### AI Integration

- Socratic questioning system
- Context-aware responses
- Structured evaluation with JSON parsing
- Fallback handling for parsing errors

### Session Persistence

- All data stored in sessionStorage
- Survives page reloads
- Cleared when browser session ends
- No server-side storage required

## Troubleshooting

### AI Not Responding

- Ensure LM Studio is running
- Check that a model is loaded
- Verify the server is running on port 1234
- Check browser console for errors

### Image Upload Issues

- Max file size: 5MB (before compression)
- Supported formats: All image types
- Images are compressed to 1024px width max
- Stored as data URLs in session

### Performance

- Large canvases may slow down with many notes
- Images are compressed but still stored in sessionStorage
- Consider limiting to ~20-30 notes per session

## Future Enhancements

- Export concepts as PDF/PNG
- Collaboration features
- Cloud storage option
- More evaluation criteria
- Concept versioning
- Integration with design tools

## License

MIT

## Credits

Built with Next.js, TailwindCSS, and LM Studio for the NCAD Interaction Design program.
