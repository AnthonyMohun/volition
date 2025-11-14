"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { askAI, SOCRATIC_SYSTEM_PROMPT } from "@/lib/ai-client";
import {
  Home,
  Loader2,
  Trophy,
  TrendingUp,
  Lightbulb,
  Target,
} from "lucide-react";

interface ConceptEvaluation {
  noteId: string;
  rank: number;
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export default function FinalPage() {
  const router = useRouter();
  const { state, resetSession } = useSession();
  const [evaluations, setEvaluations] = useState<ConceptEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conceptNotes = state.notes.filter((n) => n.isConcept);

  useEffect(() => {
    if (!state.hmwStatement || conceptNotes.length < 3) {
      router.push("/canvas");
      return;
    }

    evaluateConcepts();
  }, []);

  const evaluateConcepts = async () => {
    setIsLoading(true);
    setError(null);

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
            text += `\nVisual Reference Attached: ${note.image.caption || "Sketch/diagram included"}\n`;
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

1-3: INADEQUATE
- Missing key elements (no problem, solution, value, or implementation)
- Placeholder text or incoherent
- Doesn't address HMW at all
- Under 50 words total with no substance

4-5: UNDERDEVELOPED
- Vague or minimal detail in most sections
- Generic solution without specificity
- Weak or missing connection to HMW
- Shows limited thinking or planning
- Missing 2+ structured fields

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
- Missing structured details (Problem/Solution/Value/Implementation) = MAX SCORE 5
- Vague one-liners in each field = MAX SCORE 6
- Generic solutions without specificity = MAX SCORE 6
- No connection to HMW = SCORE 1-4
- Be strict but fair. Most work scores 5-7. Scores 8+ require excellence.
- If image is provided but unclear or unhelpful, note it in improvements

For EACH concept provide:
- 2-3 specific strengths (only if genuinely present, mention visual if strong)
- 3-4 concrete improvement areas (be specific about what's missing/weak)
- Honest 2-3 sentence feedback
- Score that reflects actual development level

Respond ONLY with valid JSON:
{
  "concepts": [
    {
      "conceptNumber": 1,
      "rank": 1,
      "score": 6,
      "strengths": ["specific strength 1", "specific strength 2"],
      "improvements": ["specific gap 1", "specific gap 2", "specific gap 3"],
      "feedback": "Honest assessment referencing what they did well and what needs work"
    }
  ]
}`;

      // Prepare messages with images for vision models
      const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
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
            text: `^ Image for Concept ${i + 1}: ${note.text}${note.image.caption ? ` (${note.image.caption})` : ""}`,
          });
        }
      });

      const messages = [
        {
          role: "system" as const,
          content: `You are a STRICT but fair design educator. Evaluate based on the structured fields provided (Problem, Solution, User Value, Implementation). Give CRITICAL feedback - low scores for incomplete work, high scores only for truly excellent submissions. If sections are missing or vague, reflect that in the score. Use the full 1-10 range appropriately.

When images/sketches are provided, also evaluate:
- How well the visual supports the written concept
- Clarity of visual communication (annotations, labels, detail)
- Whether the sketch adds meaningful information
- Quality of visual design thinking (layout, user flows, interactions)`,
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

        const parsed = JSON.parse(jsonMatch[0]);

        const evals: ConceptEvaluation[] = parsed.concepts.map((c: any) => ({
          noteId: selectedNotes[c.conceptNumber - 1]?.id || "",
          rank: c.rank,
          score: c.score,
          strengths: c.strengths,
          improvements: c.improvements,
          feedback: c.feedback,
        }));

        setEvaluations(evals.sort((a, b) => a.rank - b.rank));
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
    <div className="min-h-screen dark-gradient-radial texture-overlay p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-100">
              AI Evaluation Results
            </h1>
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 px-4 py-2 glass-light border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-200 group"
            >
              <Home className="w-4 h-4 group-hover:text-orange-400 transition-colors" />
              Start New Project
            </button>
          </div>
          <div className="glass rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300">
              <strong className="text-gray-100">Project:</strong>{" "}
              {state.hmwStatement}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="glass rounded-xl p-12 text-center border border-gray-700/50">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-lg text-gray-200">
              AI is evaluating your concepts...
            </p>
            <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="glass border border-red-500/30 rounded-xl p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={evaluateConcepts}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
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
                  className="glass rounded-xl overflow-hidden border border-gray-700/50"
                >
                  {/* Rank Header */}
                  <div
                    className={`bg-gradient-to-r ${
                      rankColors[evaluation.rank - 1]
                    } px-6 py-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <RankIcon className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          Rank #{evaluation.rank}
                        </h3>
                        <p className="text-white/90 text-sm">
                          Score: {evaluation.score}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Concept Content */}
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex gap-4">
                        {note.image && (
                          <img
                            src={note.image.dataUrl}
                            alt={note.image.caption || "Concept"}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-700"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-100 mb-2">
                            Your Concept
                          </h4>
                          <p className="text-gray-300">{note.text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Strengths */}
                      <div className="glass-light rounded-lg p-4 border border-green-500/20">
                        <h5 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {evaluation.strengths.map((strength, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-300 flex items-start gap-2"
                            >
                              <span className="text-green-400 mt-0.5">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="glass-light rounded-lg p-4 border border-blue-500/20">
                        <h5 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Areas to Develop
                        </h5>
                        <ul className="space-y-1">
                          {evaluation.improvements.map((improvement, i) => (
                            <li
                              key={i}
                              className="text-sm text-gray-300 flex items-start gap-2"
                            >
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="glass-light rounded-lg p-4 border border-purple-500/20">
                      <h5 className="font-semibold text-purple-400 mb-2">
                        Overall Feedback
                      </h5>
                      <p className="text-sm text-gray-300">
                        {evaluation.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Next Steps */}
            <div className="glass rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold text-gray-100 mb-3">
                Next Steps
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>
                    Review the feedback and identify patterns across your
                    concepts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>
                    Refine your top-ranked concept based on the suggestions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>
                    Create prototypes or sketches to test key assumptions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>
                    Gather user feedback to validate your design direction
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
