"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { askAI } from "@/lib/ai-client";
import {
  SELF_EVAL_CRITERIA,
  type ConceptSelfEvaluation,
  type StickyNote,
  scoreToGrowthTier,
  criteriaScoreToGrowthTier,
  type GrowthTierInfo,
} from "@/lib/types";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Trophy,
  Star,
  Lightbulb,
  RefreshCw,
  Loader2,
  Download,
  Bot,
  Check,
  TrendingUp,
  Zap,
  Info,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { pdf } from "@react-pdf/renderer";
import { SummaryPDF } from "@/components/summary-pdf";
import Tooltip from "@/components/tooltip";

// Emoji reactions for different score levels
const SCORE_REACTIONS = [
  ["😬", "Hmm..."],
  ["🤔", "Getting there"],
  ["😊", "Nice!"],
  ["🎉", "Great!"],
  ["🚀", "Amazing!"],
];

// AI Evaluation criteria (rubric-aligned)
interface AIConceptEvaluation {
  conceptId: string;
  overallScore: number;
  criteria: {
    problemFit: { score: number; feedback: string };
    originality: { score: number; feedback: string };
    feasibility: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  summary?: string; // AI-generated short summary
  isLoading?: boolean;
}

export default function FinalPage() {
  const router = useRouter();
  const { state, resetSession } = useSession();

  // Which concept we're evaluating (0, 1, 2)
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  // Which criteria within current concept (0-4)
  const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
  // All evaluations
  const [evaluations, setEvaluations] = useState<ConceptSelfEvaluation[]>([]);
  // Current rating being set
  const [currentRating, setCurrentRating] = useState<number>(0);
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // Final summary view
  const [showSummary, setShowSummary] = useState(false);
  // AI synthesis
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  // AI concept evaluations (before self-assessment)
  const [aiEvaluations, setAiEvaluations] = useState<AIConceptEvaluation[]>([]);
  const [showAIEvaluation, setShowAIEvaluation] = useState(true);
  const [currentAIEvalIndex, setCurrentAIEvalIndex] = useState(0);
  const [aiEvalComplete, setAiEvalComplete] = useState(false);
  const aiEvalStartedRef = useRef(false);
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const conceptNotes = state.notes.filter((n) => n.isConcept);
  const selectedNotes = state.selectedConceptIds
    .map((id) => conceptNotes.find((n) => n.id === id))
    .filter((n): n is StickyNote => n !== undefined);

  const currentConcept = selectedNotes[currentConceptIndex];
  const currentCriteria = SELF_EVAL_CRITERIA[currentCriteriaIndex];
  const totalSteps = selectedNotes.length * SELF_EVAL_CRITERIA.length;
  const currentStep =
    currentConceptIndex * SELF_EVAL_CRITERIA.length + currentCriteriaIndex + 1;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!state.hmwStatement || selectedNotes.length < 2) {
      router.push("/canvas");
    }
  }, [state.hmwStatement, selectedNotes.length, router]);

  // Initialize evaluations
  useEffect(() => {
    if (selectedNotes.length > 0 && evaluations.length === 0) {
      setEvaluations(
        selectedNotes.map((note) => ({
          conceptId: note.id,
          ratings: [],
        }))
      );
    }
  }, [selectedNotes, evaluations.length]);

  // Keyboard navigation for rating (1-5 keys and Enter)
  useEffect(() => {
    // Only enable keyboard navigation during self-assessment (not AI eval or summary)
    if (showAIEvaluation && !aiEvalComplete) return;
    if (showSummary) return;
    if (showCelebration) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-5 for rating
      if (e.key >= "1" && e.key <= "5") {
        const score = parseInt(e.key, 10);
        handleRatingSelect(score);
      }
      // Enter key to proceed to next
      if (e.key === "Enter" && currentRating > 0) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showAIEvaluation,
    aiEvalComplete,
    showSummary,
    showCelebration,
    currentRating,
  ]);

  // Generate AI evaluations for all concepts on load
  useEffect(() => {
    if (
      selectedNotes.length > 0 &&
      aiEvaluations.length === 0 &&
      showAIEvaluation &&
      !aiEvalStartedRef.current
    ) {
      aiEvalStartedRef.current = true;
      generateAIEvaluations();
    }
  }, [selectedNotes.length]);

  const generateAIEvaluations = async () => {
    const evaluationsToGenerate = selectedNotes.map((note) => ({
      conceptId: note.id,
      overallScore: 0,
      criteria: {
        problemFit: { score: 0, feedback: "" },
        originality: { score: 0, feedback: "" },
        feasibility: { score: 0, feedback: "" },
      },
      strengths: [],
      improvements: [],
      isLoading: true,
    }));

    setAiEvaluations(evaluationsToGenerate);

    // Generate evaluations one by one
    for (let i = 0; i < selectedNotes.length; i++) {
      const note = selectedNotes[i];
      try {
        const hasVisualContent = note.image || note.drawing?.dataUrl;

        // Growth-oriented evaluation prompt - focus on potential and encouragement
        const prompt = `You are a supportive design thinking mentor helping a student develop their concept for a course project.

Design Challenge: "${state.hmwStatement}"

Concept to Evaluate:
Title: "${note.text}"
${
  note.details
    ? `Description: "${note.details}"`
    : "No description provided yet."
}
${
  hasVisualContent
    ? "\nVisual Content: The student has attached an image or sketch to help communicate their concept. Please consider it as part of your evaluation."
    : ""
}

Evaluate this concept on three criteria (score 1-5 each) using a growth mindset:
1. Problem Fit: How well does this concept address the design challenge?
2. Originality: How fresh and creative is this approach?
3. Feasibility: How realistic is it to implement within a course project?
${
  hasVisualContent
    ? "\nWhen evaluating, consider how well the visual content communicates the concept, demonstrates feasibility, or adds clarity."
    : ""
}

Guidelines:
- Frame feedback constructively, focusing on potential and growth opportunities
- For concepts with less detail, encourage the student to develop the idea further
- Highlight what's working well, even in early-stage concepts
- Provide actionable, encouraging suggestions for improvement
- Use language like "This concept could grow stronger by..." or "Consider adding..."

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "problemFit": { "score": X, "feedback": "One sentence of encouraging, constructive feedback" },
  "originality": { "score": X, "feedback": "One sentence of encouraging, constructive feedback" },
  "feasibility": { "score": X, "feedback": "One sentence of encouraging, constructive feedback" },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["encouraging suggestion 1"]
}`;

        // Build multimodal content if visual content exists
        type MessageContent =
          | string
          | Array<
              | { type: "text"; text: string }
              | { type: "image_url"; image_url: { url: string } }
            >;
        let userContent: MessageContent = prompt;

        if (hasVisualContent) {
          const contentParts: Array<
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
          > = [{ type: "text", text: prompt }];

          if (note.image?.dataUrl) {
            contentParts.push({
              type: "image_url",
              image_url: { url: note.image.dataUrl },
            });
          }

          if (note.drawing?.dataUrl) {
            contentParts.push({
              type: "image_url",
              image_url: { url: note.drawing.dataUrl },
            });
          }

          userContent = contentParts;
        }

        // Request AI evaluation
        const response = await askAI(
          [
            {
              role: "system",
              content:
                "You are a supportive, encouraging design thinking mentor with vision capabilities. Focus on growth potential and constructive feedback. When images or sketches are provided, analyze them to understand the concept's visual communication and overall clarity. Frame all feedback positively, highlighting strengths and growth opportunities. Always respond with valid JSON only, no markdown formatting.",
            },
            { role: "user", content: userContent },
          ],
          0.5,
          20000
        );

        // Request AI summary (short description)
        const summaryPrompt = `Summarize the following concept in 1-2 short, clear lines for a design review. Be concise and specific.\nTitle: "${
          note.text
        }"\n${
          note.details
            ? `Description: "${note.details}"`
            : "No description provided."
        }`;
        const summaryResponseRaw = await askAI(
          [
            {
              role: "system",
              content:
                "You are a design thinking coach. Write a concise, clear summary of the concept for a design review. STRICT LIMIT: 1-2 lines, max 80 characters. Do not repeat the title. No filler. No markdown.",
            },
            { role: "user", content: summaryPrompt },
          ],
          0.3,
          40
        );
        let summaryResponse = summaryResponseRaw.trim();
        // Always use the AI's summary response, regardless of length

        // Parse the JSON response
        let parsed;
        try {
          // Clean up response - remove any markdown formatting
          const cleanedResponse = response
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          parsed = JSON.parse(cleanedResponse);
        } catch {
          // Fallback if parsing fails - use encouraging growth-oriented language
          parsed = {
            problemFit: {
              score: 2,
              feedback:
                "This concept has potential! Adding more detail will help it bloom.",
            },
            originality: {
              score: 2,
              feedback:
                "There's a creative seed here—let's see it grow with more description.",
            },
            feasibility: {
              score: 2,
              feedback:
                "With more specifics, we can better understand how to build this.",
            },
            strengths: ["You've planted the seed of an idea"],
            improvements: [
              "Help your concept grow by adding more detail about what, why, and how",
            ],
          };
        }

        // Normalize and clamp parsed scores to 1-5
        const clampScore = (s: number) =>
          Math.max(1, Math.min(5, Math.round(s)));
        parsed.problemFit.score = clampScore(parsed.problemFit.score);
        parsed.originality.score = clampScore(parsed.originality.score);
        parsed.feasibility.score = clampScore(parsed.feasibility.score);

        // Calculate overall score (kept internally for ranking, but not shown to students)
        const overallScore = Math.round(
          ((parsed.problemFit.score +
            parsed.originality.score +
            parsed.feasibility.score) /
            15) *
            100
        );

        setAiEvaluations((prev) =>
          prev.map((e, idx) =>
            idx === i
              ? {
                  ...e,
                  overallScore: overallScore,
                  criteria: {
                    problemFit: parsed.problemFit,
                    originality: parsed.originality,
                    feasibility: parsed.feasibility,
                  },
                  strengths: parsed.strengths || [],
                  improvements: parsed.improvements || [],
                  summary: summaryResponse.trim(),
                  isLoading: false,
                }
              : e
          )
        );
      } catch (error) {
        console.error(`Failed to evaluate concept ${i}:`, error);
        // Fallback - use encouraging growth-oriented language
        const baseScore = 2;
        const overallScore = 40; // Maps to "Sprout" tier
        setAiEvaluations((prev) =>
          prev.map((e, idx) =>
            idx === i
              ? {
                  ...e,
                  overallScore,
                  criteria: {
                    problemFit: {
                      score: baseScore,
                      feedback:
                        "Let's explore how this concept connects to the challenge.",
                    },
                    originality: {
                      score: baseScore,
                      feedback:
                        "There's creative potential here waiting to be developed.",
                    },
                    feasibility: {
                      score: baseScore,
                      feedback:
                        "Adding more detail will help clarify how to build this.",
                    },
                  },
                  strengths: ["You've started capturing your idea"],
                  improvements: [
                    "Help your concept grow by adding more detail",
                  ],
                  isLoading: false,
                }
              : e
          )
        );
      }
    }

    // Don't auto-complete - let user review all evaluations first
    // User must click "Continue to Self-Assessment" button to proceed
  };

  // Export function to generate downloadable PDF summary
  const handleExport = async () => {
    setIsGeneratingPDF(true);

    try {
      const rankedConcepts = selectedNotes
        .map((note, idx) => ({
          note,
          score: calculateConceptScore(idx),
          ratings: evaluations[idx]?.ratings || [],
          aiEval: aiEvaluations[idx],
        }))
        .sort((a, b) => b.score - a.score);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Generate PDF
      const pdfDoc = (
        <SummaryPDF
          hmwStatement={state.hmwStatement}
          rankedConcepts={rankedConcepts}
          aiInsight={aiInsight}
          generatedDate={dateStr}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `concept-summary-${now.toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      // Fallback to markdown export
      handleExportMarkdown();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Fallback markdown export
  const handleExportMarkdown = () => {
    const rankedConcepts = selectedNotes
      .map((note, idx) => ({
        note,
        score: calculateConceptScore(idx),
        ratings: evaluations[idx]?.ratings || [],
        aiEval: aiEvaluations[idx],
      }))
      .sort((a, b) => b.score - a.score);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let markdown = `# Design Concept Summary
📅 Generated: ${dateStr}

## 🎯 Design Challenge
${state.hmwStatement}

---

## 📊 Concept Rankings

`;

    rankedConcepts.forEach((item, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
      const tier = scoreToGrowthTier(item.score);
      markdown += `### ${medal} #${idx + 1}: ${item.note.text}
**Growth Stage: ${tier.emoji} ${tier.label}**

${item.note.details ? `> ${item.note.details}\n` : ""}

#### Self-Ratings:
`;
      SELF_EVAL_CRITERIA.forEach((c) => {
        const rating = item.ratings.find((r) => r.criteriaId === c.id);
        const ratingTier = rating
          ? criteriaScoreToGrowthTier(rating.score)
          : null;
        const display = ratingTier
          ? `${ratingTier.emoji} ${ratingTier.label}`
          : "Not rated";
        markdown += `- ${c.emoji} **${c.label}**: ${display}\n`;
      });

      if (item.aiEval && !item.aiEval.isLoading) {
        const aiTier = scoreToGrowthTier(item.aiEval.overallScore);
        markdown += `
#### AI Feedback (${aiTier.emoji} ${aiTier.label}):
- 🎯 Problem Fit: ${
          criteriaScoreToGrowthTier(item.aiEval.criteria.problemFit.score).emoji
        } — ${item.aiEval.criteria.problemFit.feedback}
- ✨ Originality: ${
          criteriaScoreToGrowthTier(item.aiEval.criteria.originality.score)
            .emoji
        } — ${item.aiEval.criteria.originality.feedback}
- 🛠️ Feasibility: ${
          criteriaScoreToGrowthTier(item.aiEval.criteria.feasibility.score)
            .emoji
        } — ${item.aiEval.criteria.feasibility.feedback}

**Strengths:** ${item.aiEval.strengths.join(", ")}
**Growth Opportunities:** ${item.aiEval.improvements.join(", ")}
`;
      }

      markdown += "\n---\n\n";
    });

    if (aiInsight) {
      markdown += `## 💡 AI Insight
${aiInsight}

---
`;
    }

    markdown += `
## 📝 Next Steps
1. Review the AI feedback and your self-ratings
2. Consider strengthening your top concept's weak areas
3. Prepare to present and defend your chosen concept

---
*Generated by Volition*
`;

    // Create and download file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `concept-summary-${now.toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate AI insight when summary is shown
  const generateInsight = async (
    rankedConcepts: Array<{
      note: StickyNote;
      score: number;
      ratings: Array<{ criteriaId: string; score: number }>;
    }>
  ) => {
    setIsLoadingInsight(true);

    try {
      // Build a summary of ratings for the AI
      const conceptSummaries = rankedConcepts
        .map((item, idx) => {
          const criteriaBreakdown = SELF_EVAL_CRITERIA.map((c) => {
            const rating = item.ratings.find((r) => r.criteriaId === c.id);
            return `${c.label}: ${rating?.score || 0}/5`;
          }).join(", ");

          return `#${idx + 1} "${item.note.text}" (Score: ${item.score}/100)
  Ratings: ${criteriaBreakdown}`;
        })
        .join("\n\n");

      // Find interesting patterns
      const topConcept = rankedConcepts[0];
      const lowestCriteria = SELF_EVAL_CRITERIA.reduce((lowest, c) => {
        const rating = topConcept.ratings.find((r) => r.criteriaId === c.id);
        const lowestRating = topConcept.ratings.find(
          (r) => r.criteriaId === lowest.id
        );
        return (rating?.score || 0) < (lowestRating?.score || 0) ? c : lowest;
      }, SELF_EVAL_CRITERIA[0]);

      const prompt = `You are a design thinking coach analyzing a student's self-evaluation of their concepts.

Design Challenge: "${state.hmwStatement}"

Their Self-Ratings:
${conceptSummaries}

Based on their self-ratings, provide ONE short, actionable insight (2-3 sentences max). Focus on:
- If there's a gap between high excitement but low doability, mention it
- If all concepts scored low on one criteria, suggest focusing there
- If the top concept has a weak spot, recommend addressing it early
- If ratings seem very similar, suggest what might differentiate them

Be direct, specific, and helpful. No fluff. Start with an emoji. Don't repeat what they can already see in the scores.`;

      const response = await askAI(
        [
          {
            role: "system",
            content:
              "You are a concise design coach. Give one specific, actionable insight based on the student's self-ratings. Be direct and helpful, not generic. Max 2-3 sentences.",
          },
          { role: "user", content: prompt },
        ],
        0.7,
        150
      );

      setAiInsight(response.trim());
    } catch (error) {
      // Fallback insight based on data
      const topConcept = rankedConcepts[0];
      const bottomConcept = rankedConcepts[rankedConcepts.length - 1];
      const scoreDiff = topConcept.score - bottomConcept.score;

      if (scoreDiff < 15) {
        setAiInsight(
          "🤔 Your concepts are rated quite similarly. Consider which one you'd be most excited to work on for the next few weeks—that passion often makes the difference."
        );
      } else {
        const weakSpot = SELF_EVAL_CRITERIA.reduce((lowest, c) => {
          const rating = topConcept.ratings.find((r) => r.criteriaId === c.id);
          const lowestRating = topConcept.ratings.find(
            (r) => r.criteriaId === lowest.id
          );
          return (rating?.score || 0) < (lowestRating?.score || 0) ? c : lowest;
        }, SELF_EVAL_CRITERIA[0]);

        setAiInsight(
          `💡 Your top concept scored lower on ${weakSpot.label}. Before moving forward, spend some time strengthening that area—it'll make your concept more well-rounded.`
        );
      }
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Handle rating selection - just set the score, no AI call
  const handleRatingSelect = (score: number) => {
    setCurrentRating(score);
  };

  // Save rating and move to next
  const handleNext = () => {
    if (currentRating === 0) return;

    // Save the rating
    const newEvaluations = [...evaluations];
    const conceptEval = newEvaluations[currentConceptIndex];
    if (conceptEval) {
      conceptEval.ratings = [
        ...conceptEval.ratings.filter(
          (r) => r.criteriaId !== currentCriteria.id
        ),
        { criteriaId: currentCriteria.id, score: currentRating },
      ];
    }
    setEvaluations(newEvaluations);

    setIsTransitioning(true);

    setTimeout(() => {
      // Move to next criteria or concept
      if (currentCriteriaIndex < SELF_EVAL_CRITERIA.length - 1) {
        setCurrentCriteriaIndex((prev) => prev + 1);
      } else if (currentConceptIndex < selectedNotes.length - 1) {
        // Finished concept, show mini celebration
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setCurrentConceptIndex((prev) => prev + 1);
          setCurrentCriteriaIndex(0);
        }, 1200);
      } else {
        // All done! Calculate rankings and get AI insight
        const ranked = selectedNotes
          .map((note, idx) => ({
            note,
            score: calculateConceptScore(idx, newEvaluations),
            ratings: newEvaluations[idx]?.ratings || [],
          }))
          .sort((a, b) => b.score - a.score);

        generateInsight(ranked);
        setShowSummary(true);
      }

      setCurrentRating(0);
      setIsTransitioning(false);
    }, 250);
  };

  const handleStartOver = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      resetSession();
      router.push("/");
    }
  };

  const calculateConceptScore = (
    conceptIndex: number,
    evals: ConceptSelfEvaluation[] = evaluations
  ) => {
    const conceptEval = evals[conceptIndex];
    if (!conceptEval || conceptEval.ratings.length === 0) return 0;
    const total = conceptEval.ratings.reduce((sum, r) => sum + r.score, 0);
    return Math.round((total / conceptEval.ratings.length) * 20); // Convert to 0-100
  };

  if (!state.hmwStatement || selectedNotes.length < 2) {
    return null;
  }

  // AI Evaluation View - shown before self-assessment
  if (showAIEvaluation && !aiEvalComplete) {
    const currentEval = aiEvaluations[currentAIEvalIndex];
    const currentNote = selectedNotes[currentAIEvalIndex];
    const allLoaded = aiEvaluations.every((e) => !e.isLoading);

    return (
      <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 text-6xl float-animation">
            🤖
          </div>
          <div
            className="absolute top-40 right-20 text-5xl float-animation"
            style={{ animationDelay: "1s" }}
          >
            ✨
          </div>
        </div>

        <PageHeader
          title="AI Concept Evaluation"
          icon={<Bot className="w-5 h-5 text-teal-500" />}
          backPath="/refine"
          subtitle="See how your concepts measure up"
          rightContent={
            <div className="flex gap-2">
              {selectedNotes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAIEvalIndex(idx)}
                  disabled={aiEvaluations[idx]?.isLoading}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all touch-manipulation ${
                    idx === currentAIEvalIndex
                      ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white scale-110 shadow-lg"
                      : aiEvaluations[idx]?.isLoading
                      ? "bg-gray-200 text-gray-400 animate-pulse"
                      : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
                  }`}
                >
                  {aiEvaluations[idx]?.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-4xl">
            {/* Concept Card (expanded, with AI Score on the right) */}
            <div className="fun-card p-4 md:p-6 border-3 border-blue-200 mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                  {currentNote?.image && (
                    <img
                      src={currentNote.image.dataUrl}
                      alt="Concept"
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-3 border-white shadow-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-wide mb-1">
                          Concept {currentAIEvalIndex + 1} of{" "}
                          {selectedNotes.length}
                        </p>
                        <h2 className="text-lg md:text-xl font-black text-gray-800">
                          {currentNote?.text}
                        </h2>
                        {currentEval?.isLoading ? (
                          <div className="px-4 py-3 bg-white rounded-2xl flex flex-col gap-2 animate-pulse mt-2">
                            <div className="h-4 w-full bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded self-start"></div>
                            <div className="h-4 w-4/5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded self-start"></div>
                            <div className="h-4 w-2/3 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded self-start"></div>
                          </div>
                        ) : currentEval?.summary ? (
                          <p className="text-sm text-gray-600 font-semibold mt-1">
                            {currentEval.summary}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline AI Growth Tier display */}
                <div className="flex-shrink-0 md:ml-4 text-center w-full md:w-28 flex md:flex-col items-center justify-center gap-3 md:gap-0">
                  {(() => {
                    const tier = currentEval
                      ? scoreToGrowthTier(currentEval.overallScore)
                      : null;
                    return (
                      <>
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg flex flex-col items-center justify-center text-white shadow-lg mx-auto bg-gradient-to-br from-teal-400 to-emerald-500">
                          {currentEval?.isLoading ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          ) : (
                            <>
                              <span className="text-2xl md:text-3xl">
                                {tier?.emoji}
                              </span>
                              <span className="text-xs font-bold mt-1">
                                {tier?.label}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-700 font-bold mt-0 md:mt-2 flex items-center gap-2 justify-center">
                          <span>Growth Stage</span>
                          <Tooltip
                            content={
                              tier?.encouragement ||
                              "The AI evaluates your concept's growth potential based on problem fit, originality, and feasibility."
                            }
                            placement="top"
                          >
                            <Info
                              className="w-4 h-4 text-gray-400 cursor-pointer"
                              aria-hidden
                            />
                          </Tooltip>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* AI Evaluation Results */}
            {currentEval?.isLoading ? (
              <div className="fun-card p-8 border-3 border-blue-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-2">
                  Analyzing Concept...
                </h3>
                <p className="text-gray-600 font-semibold">
                  The AI is evaluating your concept
                </p>
              </div>
            ) : currentEval ? (
              <div className="space-y-4">
                {/* NOTE: Overall Score moved inline with Concept Card (above) */}

                {/* Strengths & Improvements - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths Card */}
                  <div className="fun-card p-4 md:p-5 border-3 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/30 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <h4 className="font-black text-green-800 text-base md:text-lg">
                          What&apos;s Working
                        </h4>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        {currentEval.strengths.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 md:gap-3 bg-white/60 rounded-xl p-2.5 md:p-3 border border-green-200/50"
                          >
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                            </div>
                            <p className="text-xs md:text-sm text-green-900 font-semibold leading-relaxed">
                              {s}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Improvements Card */}
                  <div className="fun-card p-4 md:p-5 border-3 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <h4 className="font-black text-amber-800 text-base md:text-lg">
                          Room to Grow
                        </h4>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        {currentEval.improvements.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 md:gap-3 bg-white/60 rounded-xl p-2.5 md:p-3 border border-amber-200/50"
                          >
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lightbulb className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                            </div>
                            <p className="text-xs md:text-sm text-amber-900 font-semibold leading-relaxed">
                              {s}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criteria Breakdown - Collapsible */}
                <div className="fun-card border-3 border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setCriteriaExpanded(!criteriaExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-black text-gray-800">
                        Criteria Breakdown
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 font-semibold">
                        {(() => {
                          const avgScore = Math.round(
                            ((currentEval.criteria.problemFit.score +
                              currentEval.criteria.originality.score +
                              currentEval.criteria.feasibility.score) /
                              3) *
                              20
                          );
                          const tier = scoreToGrowthTier(avgScore);
                          return `${tier.emoji} ${tier.label}`;
                        })()}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          criteriaExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {criteriaExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                      {[
                        {
                          key: "problemFit",
                          emoji: "🎯",
                          label: "Problem Fit",
                          data: currentEval.criteria.problemFit,
                          color: "from-teal-400 to-emerald-500",
                        },
                        {
                          key: "originality",
                          emoji: "✨",
                          label: "Originality",
                          data: currentEval.criteria.originality,
                          color: "from-teal-400 to-emerald-500",
                        },
                        {
                          key: "feasibility",
                          emoji: "🛠️",
                          label: "Feasibility",
                          data: currentEval.criteria.feasibility,
                          color: "from-teal-400 to-emerald-500",
                        },
                      ].map(({ key, emoji, label, data, color }) => {
                        const tier = criteriaScoreToGrowthTier(data.score);
                        return (
                          <div key={key} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{emoji}</span>
                                <span className="font-bold text-gray-800">
                                  {label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                                <span className="text-lg">{tier.emoji}</span>
                                <span className="text-sm font-bold text-gray-700">
                                  {tier.label}
                                </span>
                              </div>
                            </div>
                            <div className="mb-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                                  style={{
                                    width: `${(data.score / 5) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              {data.feedback}
                            </p>
                          </div>
                        );
                      })}

                      {/* Growth Stages Legend */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl border border-gray-200">
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                          What These Stages Mean
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">🌱</span>
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                Seed
                              </p>
                              <p className="text-xs text-gray-600">
                                Your idea needs more detail to evaluate. Try
                                adding specifics about how it works or who it
                                helps.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">🌿</span>
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                Sprout
                              </p>
                              <p className="text-xs text-gray-600">
                                You're on the right track! A bit more thought on
                                this area will strengthen your concept.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">🌳</span>
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                Tree
                              </p>
                              <p className="text-xs text-gray-600">
                                Solid work here. Your concept shows clear
                                thinking and could move forward confidently.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">🌲</span>
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                Forest
                              </p>
                              <p className="text-xs text-gray-600">
                                Excellent! This aspect of your concept is
                                well-developed and ready to present.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 md:gap-4 mt-6 md:mt-8">
              {currentAIEvalIndex < selectedNotes.length - 1 ? (
                <button
                  onClick={() => setCurrentAIEvalIndex((prev) => prev + 1)}
                  disabled={aiEvaluations[currentAIEvalIndex + 1]?.isLoading}
                  className="fun-button-primary flex items-center gap-2 disabled:opacity-50 touch-manipulation px-5 py-3"
                >
                  Next Concept
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : allLoaded ? (
                <button
                  onClick={() => setAiEvalComplete(true)}
                  className="fun-button-primary flex items-center gap-2 touch-manipulation px-5 py-3"
                >
                  Continue to Self-Assessment
                  <Sparkles className="w-5 h-5" />
                </button>
              ) : (
                <div className="text-gray-500 font-semibold flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Waiting for all evaluations...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Summary View
  if (showSummary) {
    const rankedConcepts = selectedNotes
      .map((note, idx) => ({
        note,
        score: calculateConceptScore(idx),
        ratings: evaluations[idx]?.ratings || [],
        aiEval: aiEvaluations[idx],
      }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen fun-gradient-bg p-4 md:p-6 relative overflow-hidden">
        {/* Celebration confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-20px",
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              {
                ["🎉", "⭐", "✨", "🌟", "💜", "🚀"][
                  Math.floor(Math.random() * 6)
                ]
              }
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-6 md:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-yellow-200 to-orange-200 mb-4 shadow-lg animate-bounce">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-2 md:mb-3">
              🎊 Your Self-Assessment
            </h1>
            <p className="text-base md:text-lg text-gray-600 font-semibold">
              Here&apos;s how you rated your concepts
            </p>
          </div>

          {/* Ranked Concepts */}
          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            {rankedConcepts.map((item, idx) => (
              <div
                key={item.note.id}
                className={`fun-card p-4 md:p-6 border-3 transition-all ${
                  idx === 0
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50"
                    : "border-teal-200"
                }`}
              >
                <div className="flex items-start gap-3 md:gap-5">
                  {/* Rank Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-black shadow-lg ${
                      idx === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white"
                        : idx === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                        : "bg-gradient-to-br from-orange-300 to-orange-400 text-white"
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Concept Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {idx === 0 && (
                        <span className="text-xl md:text-2xl">👑</span>
                      )}
                      <h3 className="text-base md:text-xl font-black text-gray-800 truncate">
                        {item.note.text}
                      </h3>
                    </div>

                    {/* Mini Criteria Bars */}
                    <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                      {SELF_EVAL_CRITERIA.map((criteria) => {
                        const rating = item.ratings.find(
                          (r) => r.criteriaId === criteria.id
                        );
                        return (
                          <div
                            key={criteria.id}
                            className="flex items-center gap-1 md:gap-2"
                          >
                            <span className="text-base md:text-lg">
                              {criteria.emoji}
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 md:w-4 md:h-4 ${
                                    rating && star <= rating.score
                                      ? "fill-current"
                                      : "text-gray-300"
                                  }`}
                                  style={{
                                    color:
                                      rating && star <= rating.score
                                        ? criteria.color
                                        : undefined,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Growth Tier Display */}
                  <div className="flex-shrink-0 text-center">
                    {(() => {
                      const tier = scoreToGrowthTier(item.score);
                      return (
                        <>
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center text-white shadow-lg bg-gradient-to-br from-teal-400 to-emerald-500">
                            <span className="text-xl md:text-2xl">
                              {tier.emoji}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-bold mt-1 hidden md:block">
                            {tier.label}
                          </p>
                        </>
                      );
                    })()}
                    {item.aiEval && !item.aiEval.isLoading && (
                      <div className="mt-1 md:mt-2 flex items-center justify-center gap-1">
                        <Bot className="w-3 h-3 text-teal-500" />
                        <span className="text-xs font-bold text-teal-600">
                          {scoreToGrowthTier(item.aiEval.overallScore).emoji}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight Card */}
          <div className="fun-card p-4 md:p-6 border-3 border-blue-300 bg-gradient-to-br from-blue-50 to-teal-50 mb-6 md:mb-8">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shadow-lg">
                {isLoadingInsight ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                ) : (
                  <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-black text-gray-800 mb-2">
                  🤖 AI Insight
                </h3>
                {isLoadingInsight ? (
                  <p className="text-gray-500 font-semibold text-sm md:text-base">
                    Analyzing your ratings...
                  </p>
                ) : aiInsight ? (
                  <p className="text-gray-700 font-semibold leading-relaxed text-sm md:text-base">
                    {aiInsight}
                  </p>
                ) : (
                  <p className="text-gray-600 font-semibold leading-relaxed text-sm md:text-base">
                    Your top-rated concept is{" "}
                    <span className="text-teal-600 font-black">
                      &quot;{rankedConcepts[0]?.note.text}&quot;
                    </span>
                    . Trust your instincts—you know your design challenge best!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
            <button
              onClick={handleExport}
              disabled={isGeneratingPDF}
              className="fun-button-secondary flex items-center gap-2 disabled:opacity-50 touch-manipulation px-4 py-3 text-sm md:text-base"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              )}
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={() => {
                setShowSummary(false);
                setCurrentConceptIndex(0);
                setCurrentCriteriaIndex(0);
                setAiInsight(null);
                setEvaluations(
                  selectedNotes.map((note) => ({
                    conceptId: note.id,
                    ratings: [],
                  }))
                );
              }}
              className="fun-button-secondary flex items-center gap-2 touch-manipulation px-4 py-3 text-sm md:text-base"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
              Re-evaluate
            </button>
            <button
              onClick={handleStartOver}
              className="fun-button-primary flex items-center gap-2 touch-manipulation px-4 py-3 text-sm md:text-base"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              Start New Project
            </button>
          </div>
        </div>

        {/* Feedback QR Code */}
        <button
          onClick={() =>
            window.open("https://forms.gle/YfeDaGo1SvyihXfL9", "_blank")
          }
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col items-center z-20 hover:scale-105 transition-transform duration-200 cursor-pointer group touch-manipulation"
        >
          <img
            src="/feedback.jpg"
            alt="Feedback QR Code"
            className="w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-lg border-2 border-white group-hover:shadow-xl"
          />
          <span className="mt-2 text-xs md:text-sm font-bold text-gray-600 bg-white/80 px-2 md:px-3 py-1 rounded-full shadow-sm group-hover:bg-white">
            Give Feedback
          </span>
        </button>
      </div>
    );
  }

  // Mini Celebration between concepts
  if (showCelebration) {
    return (
      <div className="min-h-screen fun-gradient-bg flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">
            Concept {currentConceptIndex + 1} Complete!
          </h2>
          <p className="text-lg text-gray-600 font-semibold">
            {selectedNotes.length - currentConceptIndex - 1} more to go...
          </p>
        </div>
      </div>
    );
  }

  // Main Evaluation Interface - Clean and fast, no AI interruptions
  return (
    <div className="min-h-screen fun-gradient-bg flex flex-col relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 text-6xl float-animation">
          ⭐
        </div>
        <div
          className="absolute top-40 right-20 text-5xl float-animation"
          style={{ animationDelay: "1s" }}
        >
          💡
        </div>
        <div
          className="absolute bottom-32 left-1/4 text-5xl float-animation"
          style={{ animationDelay: "2s" }}
        >
          ✨
        </div>
      </div>

      <PageHeader
        title="Rate Your Concepts"
        icon={<Target className="w-5 h-5 text-teal-500" />}
        backPath="/refine"
        onNewProject={handleStartOver}
        subtitle={`Step ${currentStep} of ${totalSteps}`}
        rightContent={
          <>
            {/* Progress */}
            <div className="flex-1 max-w-xs mx-2 md:mx-4 hidden sm:block">
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Concept indicator */}
            <div className="flex gap-1.5 md:gap-2">
              {selectedNotes.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm transition-all ${
                    idx === currentConceptIndex
                      ? "bg-gradient-to-br from-blue-500 to-teal-500 text-white scale-110 shadow-lg"
                      : idx < currentConceptIndex
                      ? "bg-green-400 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {idx < currentConceptIndex ? "✓" : idx + 1}
                </div>
              ))}
            </div>
          </>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl">
          {/* Current Concept Card */}
          <div
            className={`fun-card p-4 md:p-6 border-3 border-teal-200 mb-6 md:mb-8 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-x-8"
                : "opacity-100 translate-x-0"
            }`}
          >
            <div className="flex items-start gap-3 md:gap-4">
              {currentConcept?.image && (
                <img
                  src={currentConcept.image.dataUrl}
                  alt="Concept"
                  className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl object-cover border-3 border-white shadow-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-teal-600 uppercase tracking-wide mb-1">
                  Concept {currentConceptIndex + 1}
                </p>
                <h2 className="text-lg md:text-xl font-black text-gray-800 mb-1 md:mb-2 leading-tight">
                  {currentConcept?.text}
                </h2>
                {currentConcept?.details && (
                  <p className="text-xs md:text-sm text-gray-600 font-semibold line-clamp-2">
                    {currentConcept.details.split("\n")[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div
            className={`fun-card p-5 md:p-8 border-3 mb-6 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 -translate-x-8"
                : "opacity-100 translate-x-0"
            }`}
            style={{ borderColor: currentCriteria?.color }}
          >
            {/* Criteria Header */}
            <div className="text-center mb-6 md:mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl mb-3 md:mb-4 shadow-lg"
                style={{ backgroundColor: `${currentCriteria?.color}20` }}
              >
                <span className="text-3xl md:text-4xl">
                  {currentCriteria?.emoji}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-2">
                {currentCriteria?.label}
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-semibold">
                {currentCriteria?.description}
              </p>
            </div>

            {/* Rating Buttons */}
            <div className="flex justify-center gap-2.5 md:gap-4 mb-5 md:mb-6">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleRatingSelect(score)}
                  className={`group relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl font-black text-lg md:text-xl transition-all duration-200 touch-manipulation ${
                    currentRating === score
                      ? "scale-110 md:scale-125 shadow-xl"
                      : "hover:scale-105 md:hover:scale-110 hover:shadow-lg active:scale-95"
                  }`}
                  style={{
                    backgroundColor:
                      currentRating === score
                        ? currentCriteria?.color
                        : currentRating >= score
                        ? `${currentCriteria?.color}60`
                        : "#f3f4f6",
                    color: currentRating >= score ? "white" : "#6b7280",
                  }}
                >
                  {score}
                  {currentRating === score && (
                    <span className="absolute -top-7 md:-top-8 left-1/2 -translate-x-1/2 text-xl md:text-2xl animate-bounce">
                      {SCORE_REACTIONS[score - 1][0]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between text-xs md:text-sm text-gray-500 font-bold px-1 md:px-2">
              <span>{currentCriteria?.lowLabel}</span>
              <span>{currentCriteria?.highLabel}</span>
            </div>

            {/* Keyboard hint - hide on smaller screens */}
            <div className="mt-4 text-center hidden md:block">
              <p className="text-xs text-gray-400 font-medium">
                💡 Press{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-gray-600">
                  1
                </kbd>
                -
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-gray-600">
                  5
                </kbd>{" "}
                to rate,{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-gray-600">
                  Enter
                </kbd>{" "}
                to continue
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={currentRating === 0}
              className="fun-button-primary flex items-center gap-2 md:gap-3 text-base md:text-lg px-6 py-3 md:px-8 md:py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
            >
              {currentCriteriaIndex < SELF_EVAL_CRITERIA.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </>
              ) : currentConceptIndex < selectedNotes.length - 1 ? (
                <>
                  Next Concept
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                </>
              ) : (
                <>
                  See Results
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
