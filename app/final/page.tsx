"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { askAI } from "@/lib/ai-client";
import {
  ListRestart,
  Loader2,
  Trophy,
  TrendingUp,
  Lightbulb,
  Target,
  Sparkles,
  ListChecks,
  BarChart3,
} from "lucide-react";

interface CriteriaScores {
  problemUnderstanding: number;
  solutionClarity: number;
  userValue: number;
  feasibility: number;
  innovation: number;
  visualCommunication: number;
}

interface EvaluationSummary {
  topConceptNumber: number;
  topConceptReason: string;
  keyThemes: string[];
  nextSteps: string[];
}

interface AIConceptPayload {
  conceptNumber: number;
  rank: number;
  score: number;
  criteria?: Partial<CriteriaScores>;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface EvaluationResponsePayload {
  summary?: EvaluationSummary;
  concepts: AIConceptPayload[];
}

interface ConceptEvaluation {
  conceptNumber: number;
  noteId: string;
  rank: number;
  score: number;
  criteria: CriteriaScores;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

const CRITERIA_DISPLAY: Array<{
  key: keyof CriteriaScores;
  label: string;
  accent: string;
}> = [
  {
    key: "problemUnderstanding",
    label: "Problem Clarity",
    accent: "from-pink-500 to-orange-500",
  },
  {
    key: "solutionClarity",
    label: "Solution Depth",
    accent: "from-orange-500 to-yellow-500",
  },
  {
    key: "userValue",
    label: "User Value",
    accent: "from-yellow-500 to-lime-500",
  },
  {
    key: "feasibility",
    label: "Feasibility",
    accent: "from-teal-500 to-blue-500",
  },
  {
    key: "innovation",
    label: "Innovation",
    accent: "from-purple-500 to-pink-500",
  },
  {
    key: "visualCommunication",
    label: "Visual Comms",
    accent: "from-sky-500 to-indigo-500",
  },
];

export default function FinalPage() {
  const router = useRouter();
  const { state, resetSession } = useSession();
  const [evaluations, setEvaluations] = useState<ConceptEvaluation[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent duplicate calls to the AI (e.g. React strict mode double-invoke or rapid re-renders)
  const evaluationInProgressRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const conceptNotes = state.notes.filter((n) => n.isConcept);
  const topEvaluation = summary
    ? evaluations.find(
        (evaluation) => evaluation.conceptNumber === summary.topConceptNumber
      )
    : null;
  const topConceptNote = topEvaluation
    ? conceptNotes.find((n) => n.id === topEvaluation.noteId)
    : null;
  const scoreValues = evaluations.map((evaluation) => evaluation.score);
  const scoreStats =
    scoreValues.length > 0
      ? {
          avg: (
            scoreValues.reduce((total, value) => total + value, 0) /
            scoreValues.length
          ).toFixed(1),
          high: Math.max(...scoreValues),
          low: Math.min(...scoreValues),
        }
      : null;
  const leadingConcept = evaluations[0];
  const trailingConcept =
    evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;
  const leadingConceptNote = leadingConcept
    ? conceptNotes.find((n) => n.id === leadingConcept.noteId)
    : null;
  const trailingConceptNote = trailingConcept
    ? conceptNotes.find((n) => n.id === trailingConcept.noteId)
    : null;
  const previewText = (text?: string) => {
    if (!text) return "";
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  };

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 3) {
      router.push("/canvas");
      return;
    }

    evaluateConcepts();
  }, [JSON.stringify(state.selectedConceptIds), state.hmwStatement]);

  const evaluateConcepts = async () => {
    // Guard: prevent concurrent/effective duplicate calls
    if (evaluationInProgressRef.current) {
      console.debug("Evaluation already in progress, skipping duplicate call");
      return;
    }
    evaluationInProgressRef.current = true;

    setIsLoading(true);
    setError(null);
    setSummary(null);
    setEvaluations([]);

    try {
      // Only evaluate the selected concepts
      const selectedNotes = state.selectedConceptIds
        .map((id) => conceptNotes.find((n) => n.id === id))
        .filter((note) => note !== undefined) as typeof conceptNotes;

      // Build detailed concept descriptions with structured fields
      const conceptsText = selectedNotes
        .map((note, i) => {
          let text = `Concept ${i + 1}:\n`;
          text += `Title: ${note.text}\n`;

          if (note.details && note.details.trim()) {
            // Parse structured details if available
            const details = note.details;
            if (details.includes("Problem:")) {
              text += `\n${details}\n`;
            } else {
              text += `\nDetails: ${details}\n`;
            }
          } else {
            text += `\n[No structured details provided]\n`;
          }

          if (note.image) {
            text += `\nVisual Reference Attached: ${
              note.image.caption || "Sketch/diagram included"
            }\n`;
            text += `[IMAGE: See attached visual for Concept ${i + 1}]\n`;
          }

          return text;
        })
        .join("\n---\n\n");

      const evaluationPrompt = `You are a CRITICAL design educator evaluating student design concepts. Provide HONEST, constructive assessment.

HMW Statement: "${state.hmwStatement}"

Student's Concepts (structured with Problem, Solution, User Value, Implementation):
${conceptsText}

=== EVALUATION FRAMEWORK ===

Assess each concept on these dimensions:

1. PROBLEM UNDERSTANDING:
   - Does the concept clearly identify and understand the problem?
   - Is it connected to the HMW statement?
   - Is the problem articulated in a meaningful way?

2. SOLUTION CLARITY & DEPTH:
   - Is the solution specific and well-explained?
   - Does it logically address the problem identified?
   - Is there enough detail to understand HOW it works?

3. USER VALUE:
   - Are user benefits clearly articulated?
   - Is the value proposition compelling?
   - Does it consider the user perspective?

4. FEASIBILITY & REALISM:
   - Is the implementation approach realistic?
   - Are there concrete steps or considerations mentioned?
   - Does it show understanding of constraints and resources?

5. INNOVATION & THOUGHTFULNESS:
   - Does it show original thinking?
   - Is it more than just an obvious/generic solution?
   - Does it demonstrate design thinking depth?

6. VISUAL COMMUNICATION (if sketch/image provided):
   - Does the visual clearly communicate the concept?
   - Are there helpful annotations or labels?
   - Does the sketch show design thinking (user flows, interactions, layout)?
   - Does the visual add meaningful information beyond the text?

=== STRICT SCORING (1-10) ===

1: EMPTY/NO CONTENT
- Concept has only a title with "[No structured details provided]"
- No problem, solution, value, or implementation described
- Completely blank or placeholder concept
- Absolutely no substance to evaluate

2-3: INADEQUATE
- Missing 3-4 key elements (problem, solution, value, implementation)
- Only 1-2 sentences total across all fields
- Placeholder text or incoherent
- Doesn't address HMW at all
- Under 50 words total with minimal substance

4-5: UNDERDEVELOPED
- Vague or minimal detail in most sections
- Generic solution without specificity
- Weak or missing connection to HMW
- Shows limited thinking or planning
- Missing 2 structured fields

6-7: ADEQUATE/DEVELOPING
- Has most structured elements but some are thin
- Addresses HMW but in a basic way
- Solution makes sense but lacks depth
- Implementation is mentioned but not well thought through
- Shows decent thinking but room for much more

8-9: STRONG
- All structured elements present with good detail
- Clear problem-solution fit
- Specific, actionable implementation plan
- Compelling user value articulation
- Shows thoughtful design reasoning
- Visual (if included) effectively supports the concept

10: EXCEPTIONAL
- Comprehensive detail in all sections
- Deep problem understanding
- Innovative, well-justified solution
- Clear feasibility with realistic plan
- Demonstrates sophisticated design thinking
- Visual communication (if included) is clear, detailed, and insightful

=== CRITICAL RULES ===
- "[No structured details provided]" or completely empty = SCORE 1
- Only title with no other content = SCORE 1
- Missing 3+ structured fields (Problem/Solution/Value/Implementation) = SCORE 2-3
- Missing 2 structured fields or very sparse = MAX SCORE 5
- Vague one-liners in each field = MAX SCORE 6
- Generic solutions without specificity = MAX SCORE 6
- No connection to HMW = SCORE 1-4
- Be strict but fair. Empty work = 1, minimal work = 2-5. Most developed work scores 5-7. Scores 8+ require excellence.
- If image is provided but unclear or unhelpful, note it in improvements

=== EVIDENCE & CONSISTENCY REQUIREMENTS ===
- Read every concept block carefully before judging; do not skip fields.
- Base every strength, improvement, and feedback sentence on specific phrases or facts from the provided Problem/Solution/User Value/Implementation/Visual descriptions.
- Reference the source field (e.g., "Problem", "Solution") or quote short phrases to show you are using the student's actual input.
- If you see "[No structured details provided]" with only a title, the concept is EMPTY - score it 1.
- If information is missing, contradictory, or extremely vague, explicitly state that and lower the score accordingly—never invent details or be generous.
- When visuals are attached, mention what the visual actually shows (or that it lacks useful detail) rather than assuming content.
- DO NOT give credit for potential or imagination—only evaluate what is actually written.

For EACH concept provide:
- 2-3 specific strengths (only if genuinely present, mention visual if strong)
- 3-4 concrete improvement areas (be specific about what's missing/weak)
- Honest 2-3 sentence feedback
- Score that reflects actual development level
- A six-part criteria scorecard (integers 1-10) using keys: problemUnderstanding, solutionClarity, userValue, feasibility, innovation, visualCommunication

After evaluating all concepts, append a SUMMARY object with:
- topConceptNumber (the concept # with the highest overall impact)
- topConceptReason (why it leads)
- keyThemes (2-3 cross-concept insights)
- nextSteps (2-3 actionable items referencing the evaluations)

Respond ONLY with valid JSON:
{
  "summary": {
    "topConceptNumber": 1,
    "topConceptReason": "short justification tied to evaluation",
    "keyThemes": ["theme 1", "theme 2"],
    "nextSteps": ["action 1", "action 2"]
  },
  "concepts": [
    {
      "conceptNumber": 1,
      "rank": 1,
      "score": 6,
      "criteria": {
        "problemUnderstanding": 6,
        "solutionClarity": 6,
        "userValue": 6,
        "feasibility": 6,
        "innovation": 6,
        "visualCommunication": 6
      },
      "strengths": ["specific strength 1", "specific strength 2"],
      "improvements": ["specific gap 1", "specific gap 2", "specific gap 3"],
      "feedback": "Honest assessment referencing what they did well and what needs work"
    }
  ]
}`;

      // Prepare messages with images for vision models
      const userContent: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      > = [
        {
          type: "text",
          text: evaluationPrompt,
        },
      ];

      // Add images to the user message if available
      selectedNotes.forEach((note, i) => {
        if (note.image?.dataUrl) {
          userContent.push({
            type: "image_url",
            image_url: {
              url: note.image.dataUrl,
            },
          });
          userContent.push({
            type: "text",
            text: `^ Image for Concept ${i + 1}: ${note.text}${
              note.image.caption ? ` (${note.image.caption})` : ""
            }`,
          });
        }
      });

      const messages = [
        {
          role: "system" as const,
          content: `You are a STRICT but fair design educator. Evaluate ONLY the concepts exactly as described in the provided fields (Problem, Solution, User Value, Implementation, Visual). NEVER invent missing details or rely on outside knowledge. Consistency matters more than generosity.

Follow this protocol for every concept:
1. Evidence Scan: Read the entire concept block first so you know precisely what the student provided in each field.
2. Empty Concept Check: If you see "[No structured details provided]" with only a title, immediately score it 1 with feedback explaining nothing was submitted.
3. Traceable Feedback: Every strength, improvement, and feedback sentence must cite the source field or quote/paraphrase the student's actual wording so it is obvious you evaluated their real input.
4. Missing Info Handling: If a field is absent, contradictory, or vague, state that explicitly in improvements and reduce the score—do not fill in gaps yourself or imagine what they might have meant.
5. Visual Review: When images or sketches exist, mention what is visible (or that it lacks detail). If no image is provided, do not assume one.
6. Scoring Discipline: Use the full 1-10 range ruthlessly. Empty concepts = 1. Incomplete or shallow work stays ≤5. Reserve 6-7 for adequate work, and 8-10 for concepts that clearly demonstrate excellence across all fields.

CRITICAL: Do not be generous. If a concept has no substance, score it 1-2. If it's minimal, score it 2-5. Only well-developed concepts deserve 6+.
`,
        },
        {
          role: "user" as const,
          content: userContent,
        },
      ];

      const response = await askAI(messages, 0.15, 2000);

      // Parse AI response
      try {
        // Extract JSON from response (in case AI adds extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        const parsed = JSON.parse(jsonMatch[0]) as EvaluationResponsePayload;

        const summaryData: EvaluationSummary | null = parsed.summary
          ? {
              topConceptNumber: parsed.summary.topConceptNumber,
              topConceptReason: parsed.summary.topConceptReason,
              keyThemes: parsed.summary.keyThemes || [],
              nextSteps: parsed.summary.nextSteps || [],
            }
          : null;

        const evals: ConceptEvaluation[] = (parsed.concepts || []).map(
          (concept: AIConceptPayload) => ({
            conceptNumber: concept.conceptNumber,
            noteId: selectedNotes[concept.conceptNumber - 1]?.id || "",
            rank: concept.rank,
            score: concept.score,
            criteria: {
              problemUnderstanding:
                concept.criteria?.problemUnderstanding ?? concept.score,
              solutionClarity:
                concept.criteria?.solutionClarity ?? concept.score,
              userValue: concept.criteria?.userValue ?? concept.score,
              feasibility: concept.criteria?.feasibility ?? concept.score,
              innovation: concept.criteria?.innovation ?? concept.score,
              visualCommunication:
                concept.criteria?.visualCommunication ?? concept.score,
            },
            strengths: concept.strengths,
            improvements: concept.improvements,
            feedback: concept.feedback,
          })
        );

        // Sort by score descending (highest score first) and assign correct ranks
        const sortedEvals = evals.sort((a, b) => b.score - a.score);
        sortedEvals.forEach((evaluation, index) => {
          evaluation.rank = index + 1;
        });

        setEvaluations(sortedEvals);
        setSummary(summaryData);
      } catch (parseError) {
        console.error(
          "Failed to parse AI response:",
          parseError,
          "Response:",
          response
        );
        throw new Error(
          "Failed to parse evaluation response. Please try again."
        );
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
      setError(
        "Failed to get AI evaluation. Please check your LM Studio connection."
      );
    } finally {
      // Allow future evaluations again
      evaluationInProgressRef.current = false;
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      resetSession();
      router.push("/");
    }
  };

  if (!state.hmwStatement || conceptNotes.length < 3) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-black text-black flex items-center gap-3">
              🎯 AI Evaluation Results
            </h1>
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 px-5 py-3 fun-button-primary group"
            >
              <ListRestart className="w-5 h-5" />
              Start New Project
            </button>
          </div>
          <div className="fun-card border-3 border-purple-300 mb-6">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 blur-xl opacity-50" />
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              💭 YOUR DESIGN CHALLENGE
            </h3>
            <p className="text-black font-bold text-lg leading-relaxed relative z-10">
              {state.hmwStatement}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="fun-card border-3 border-purple-300 p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 mb-6 shadow-lg">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
            <p className="text-2xl font-black text-black mb-2">
              🤖 AI is evaluating your concepts...
            </p>
            <p className="text-base text-gray-600 font-semibold">
              This may take a moment ⏳
            </p>
          </div>
        ) : error ? (
          <div className="fun-card border-3 border-red-300 p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-bold text-lg mb-6">{error}</p>
            <button
              onClick={evaluateConcepts}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl shadow-[0_8px_0_rgb(220,38,38),0_8px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_0_rgb(220,38,38),0_4px_15px_rgba(220,38,38,0.4)] active:shadow-[0_2px_0_rgb(220,38,38)] hover:-translate-y-1 active:translate-y-1 transition-all"
            >
              🔄 Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {summary && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 fun-card border-3 border-yellow-400 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 blur-3xl opacity-30" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-tr from-pink-200 to-purple-200 blur-2xl opacity-30" />
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 mb-3">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-yellow-700">
                          🏆 Top Concept Spotlight
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-black mb-3">
                        Concept #
                        {topEvaluation?.conceptNumber ??
                          summary.topConceptNumber}
                      </h3>
                      <p className="text-base text-gray-700 font-semibold mb-4">
                        {summary.topConceptReason}
                      </p>
                      {topConceptNote && (
                        <p className="text-base text-black font-bold">
                          {topConceptNote.text}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-white border-3 border-yellow-300 shadow-[0_6px_0_rgb(251,191,36),inset_0_2px_0_rgba(255,255,255,0.8)]">
                        <p className="text-xs font-bold uppercase text-yellow-600">
                          Score
                        </p>
                        <p className="text-5xl font-black text-black">
                          {topEvaluation?.score ?? "—"}
                        </p>
                        <p className="text-xs font-bold text-gray-600">
                          Rank #{topEvaluation?.rank ?? "?"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 lg:col-span-1">
                  <div className="fun-card border-3 border-purple-300 h-full">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-purple-600 mb-4">
                      <Sparkles className="w-5 h-5" />✨ Key Themes
                    </div>
                    {summary.keyThemes.length > 0 ? (
                      <ul className="space-y-3 text-sm">
                        {summary.keyThemes.map((theme, index) => (
                          <li key={index} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-black">
                              {theme}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 font-semibold">
                        Themes will appear once the AI response includes them.
                      </p>
                    )}
                  </div>
                  <div className="fun-card border-3 border-green-300">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-green-600 mb-4">
                      <ListChecks className="w-5 h-5" />
                      🎯 Next Steps
                    </div>
                    {summary.nextSteps.length > 0 ? (
                      <ul className="space-y-3 text-sm">
                        {summary.nextSteps.map((step, index) => (
                          <li key={index} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-black">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 font-semibold">
                        Tailored next steps will appear with the next AI run.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {evaluations.map((evaluation) => {
              const note = conceptNotes.find((n) => n.id === evaluation.noteId);
              if (!note) return null;

              const rankColors = [
                "from-yellow-500 to-orange-500",
                "from-gray-400 to-gray-500",
                "from-orange-400 to-orange-500",
              ];
              const rankIcons = [Trophy, TrendingUp, Target];
              const RankIcon = rankIcons[evaluation.rank - 1] || Target;

              return (
                <div
                  key={evaluation.noteId}
                  className="fun-card border-3 border-purple-300 overflow-hidden"
                >
                  {/* Rank Header */}
                  <div
                    className={`bg-gradient-to-r ${
                      rankColors[evaluation.rank - 1] ||
                      "from-gray-700 to-gray-800"
                    } px-6 py-5 flex items-center justify-between shadow-[inset_0_2px_0_rgba(255,255,255,0.3)]`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <RankIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-white/90">
                          Concept #{evaluation.conceptNumber}
                        </p>
                        <h3 className="text-white font-black text-2xl">
                          Rank #{evaluation.rank}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">
                      <p className="text-white font-black text-2xl">
                        {evaluation.score}
                      </p>
                      <p className="text-white/80 font-bold text-xs text-center">
                        /10
                      </p>
                    </div>
                  </div>

                  {/* Concept Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex flex-col gap-4 md:flex-row">
                        {note.image && (
                          <img
                            src={note.image.dataUrl}
                            alt={note.image.caption || "Concept"}
                            className="w-40 h-40 object-cover rounded-2xl border-3 border-purple-200 shadow-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 mb-2">
                            💡 YOUR CONCEPT
                          </p>
                          <h4 className="font-black text-black text-2xl mb-3">
                            {note.text}
                          </h4>
                          {note.details && (
                            <p className="text-sm text-gray-700 font-semibold whitespace-pre-line leading-relaxed">
                              {note.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Criteria Breakdown */}
                    <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {CRITERIA_DISPLAY.map((criterion) => {
                        const value = evaluation.criteria[criterion.key];
                        const progress = Math.min(
                          100,
                          Math.max(0, (value / 10) * 100)
                        );

                        return (
                          <div
                            key={criterion.key}
                            className="bg-white rounded-2xl p-4 border-3 border-gray-200 shadow-[0_4px_0_rgb(229,231,235),inset_0_2px_0_rgba(255,255,255,0.8)]"
                          >
                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-600 mb-2">
                              <span>{criterion.label}</span>
                              <span className="text-black text-sm">
                                {value}/10
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${criterion.accent} shadow-sm`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {/* Strengths */}
                      <div className="bg-white rounded-2xl p-5 border-3 border-green-300 shadow-[0_4px_0_rgb(134,239,172),inset_0_2px_0_rgba(255,255,255,0.8)]">
                        <h5 className="font-black text-green-600 mb-4 flex items-center gap-2 text-base">
                          <Lightbulb className="w-5 h-5" />
                          💪 Strengths
                        </h5>
                        <ul className="space-y-3">
                          {evaluation.strengths.map((strength, i) => (
                            <li
                              key={i}
                              className="text-sm text-black font-semibold flex items-start gap-3"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 text-white font-black text-xs flex items-center justify-center mt-0.5">
                                ✓
                              </span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="bg-white rounded-2xl p-5 border-3 border-blue-300 shadow-[0_4px_0_rgb(147,197,253),inset_0_2px_0_rgba(255,255,255,0.8)]">
                        <h5 className="font-black text-blue-600 mb-4 flex items-center gap-2 text-base">
                          <TrendingUp className="w-5 h-5" />
                          📈 Areas to Develop
                        </h5>
                        <ul className="space-y-3">
                          {evaluation.improvements.map((improvement, i) => (
                            <li
                              key={i}
                              className="text-sm text-black font-semibold flex items-start gap-3"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-sky-400 text-white font-black text-xs flex items-center justify-center mt-0.5">
                                →
                              </span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-3 border-purple-200 shadow-[0_4px_0_rgb(233,213,255),inset_0_2px_0_rgba(255,255,255,0.8)]">
                      <h5 className="font-black text-purple-600 mb-3 flex items-center gap-2 text-base">
                        💬 Overall Feedback
                      </h5>
                      <p className="text-sm text-black font-semibold leading-relaxed">
                        {evaluation.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {scoreStats && (
              <div className="fun-card border-3 border-orange-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
                      📊 Score Snapshot
                    </p>
                    <p className="text-lg font-black text-black">
                      How your concepts compare
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-white rounded-2xl p-5 border-3 border-gray-200 shadow-[0_4px_0_rgb(229,231,235),inset_0_2px_0_rgba(255,255,255,0.8)] text-center">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Average
                    </p>
                    <p className="text-5xl font-black text-black">
                      {scoreStats.avg}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-3 border-green-300 shadow-[0_4px_0_rgb(134,239,172),inset_0_2px_0_rgba(255,255,255,0.8)] text-center">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                      🏆 Highest
                    </p>
                    <p className="text-5xl font-black text-black">
                      {scoreStats.high}
                    </p>
                    {leadingConcept && (
                      <p className="text-xs text-gray-700 font-semibold mt-2">
                        Concept #{leadingConcept.conceptNumber}
                        {leadingConceptNote
                          ? ` · ${previewText(leadingConceptNote.text)}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border-3 border-blue-300 shadow-[0_4px_0_rgb(147,197,253),inset_0_2px_0_rgba(255,255,255,0.8)] text-center">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      Lowest
                    </p>
                    <p className="text-5xl font-black text-black">
                      {scoreStats.low}
                    </p>
                    {trailingConcept && (
                      <p className="text-xs text-gray-700 font-semibold mt-2">
                        Concept #{trailingConcept.conceptNumber}
                        {trailingConceptNote
                          ? ` · ${previewText(trailingConceptNote.text)}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
