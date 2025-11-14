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

      // Build detailed concept descriptions including token allocation
      const conceptsText = selectedNotes
        .map((note, i) => {
          const tokens = state.tokenAllocation[note.id] || 0;
          let text = `Concept ${i + 1}:\n`;
          text += `- Title/Summary: ${note.text}\n`;

          if (note.details && note.details.trim()) {
            text += `- Detailed Description: ${note.details}\n`;
          } else {
            text += `- Detailed Description: [No details provided]\n`;
          }

          if (note.image?.caption) {
            text += `- Visual Reference: ${note.image.caption}\n`;
          }

          text += `- Student Investment: ${tokens} tokens allocated (indicates confidence level)\n`;

          return text;
        })
        .join("\n");

      const evaluationPrompt = `You are a CRITICAL design educator evaluating student design concepts. Your job is to provide HONEST assessment, not encouragement.

HMW Statement: "${state.hmwStatement}"

Student's Selected Concepts:
${conceptsText}

=== CRITICAL EVALUATION RUBRIC ===

Evaluate each concept on CONTENT QUALITY and DESIGN MERIT:

1. DEVELOPMENT LEVEL:
   - How much meaningful, specific detail is present?
   - Are ideas fleshed out or just vague statements?
   - Does it show actual thinking or just placeholder text?

2. RELEVANCE & CLARITY:
   - Does it clearly address the HMW statement?
   - Is the concept understandable and specific?
   - Would someone else understand what's being proposed?

3. FEASIBILITY & INNOVATION:
   - Is it actionable and realistic?
   - Does it show original thinking or is it generic/obvious?
   - Would this actually solve the HMW problem?

4. SERIOUSNESS OF SUBMISSION:
   - Does the token allocation match the concept quality?
   - Does the level of detail justify student confidence?

=== STRICT SCORING GUIDELINES ===

1-3: INADEQUATE - Missing or placeholder text, no details, incoherent, doesn't address HMW
4-5: MINIMAL/UNDERDEVELOPED - Very brief, minimal detail, generic ideas, weak HMW connection
6-7: BASIC/ADEQUATE - Some detail, addresses HMW generically, decent but not strong
8-9: STRONG/WELL-DEVELOPED - Clear detail, thoughtful approach, strong relevance
10: EXCELLENT - Detailed, innovative, clearly solves HMW

=== CRITICAL RULES ===
- [No details provided] = MAXIMUM SCORE 5
- Concept under 30 characters = MAXIMUM SCORE 4
- Doesn't relate to HMW = SCORE 1-4
- Be strict. Underdeveloped work gets low scores.
- Most work scores 4-7. Scores 8+ are rare.

Respond ONLY with valid JSON:
{
  "concepts": [
    {
      "conceptNumber": 1,
      "rank": 1,
      "score": 5,
      "strengths": ["strength"],
      "improvements": ["gap 1", "gap 2", "gap 3"],
      "feedback": "Honest assessment"
    }
  ]
}`;

      const response = await askAI(
        [
          {
            role: "system",
            content: `You are a STRICT design educator. Give HONEST, CRITICAL feedback - not encouragement. Underdeveloped work gets LOW scores. Use full 1-10 range. Most student work scores 4-7. Do NOT give 7+ scores for incomplete submissions.`,
          },
          {
            role: "user",
            content: evaluationPrompt,
          },
        ],
        0.15,
        1800
      );

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
