"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  SELF_EVAL_CRITERIA,
  type StickyNote,
  type SelfEvaluationRating,
  scoreToGrowthTier,
  criteriaScoreToGrowthTier,
} from "@/lib/types";

// Register a font (optional - using Helvetica as default)
Font.register({
  family: "Helvetica",
  fonts: [{ src: "Helvetica" }, { src: "Helvetica-Bold", fontWeight: "bold" }],
});

// Text symbols for growth tiers (PDF-compatible)
const TIER_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  seed: { symbol: "●", color: "#a3e635" },
  sprout: { symbol: "●●", color: "#4ade80" },
  tree: { symbol: "●●●", color: "#2dd4bf" },
  forest: { symbol: "●●●●", color: "#61ABC4" },
};

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  challengeSection: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  challengeLabel: {
    fontSize: 10,
    color: "#9333ea",
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  challengeText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 1.5,
  },
  conceptCard: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    border: "2px solid #e5e7eb",
  },
  conceptCardFirst: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    border: "2px solid #fbbf24",
    backgroundColor: "#fffbeb",
  },
  conceptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#9333ea",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankBadgeFirst: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  conceptInfo: {
    flex: 1,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  conceptDetails: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  scoreContainer: {
    alignItems: "center",
    marginLeft: 12,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCircleHigh: {
    backgroundColor: "#22c55e",
  },
  scoreCircleMedium: {
    backgroundColor: "#8b5cf6",
  },
  scoreCircleLow: {
    backgroundColor: "#f97316",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },
  imageContainer: {
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  conceptImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    objectFit: "cover",
  },
  ratingsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #e5e7eb",
  },
  ratingsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  ratingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  ratingEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingStars: {
    fontSize: 10,
    color: "#fbbf24",
  },
  aiSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #e5e7eb",
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#396bb2",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  aiScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  aiCriteria: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 2,
  },
  aiFeedback: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 10,
    marginLeft: 0,
  },
  strengthsImprovements: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  strengthsBox: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 6,
  },
  improvementsBox: {
    flex: 1,
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 6,
  },
  boxLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  boxItem: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
  },
  insightSection: {
    backgroundColor: "#eef3ff",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#396bb2",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  insightText: {
    fontSize: 12,
    color: "#1f2937",
    lineHeight: 1.5,
  },
  nextStepsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  nextStepsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nextStepItem: {
    fontSize: 11,
    color: "#4b5563",
    marginBottom: 4,
    paddingLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 9,
    paddingTop: 10,
    borderTop: "1px solid #e5e7eb",
  },
  legendSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    border: "1px solid #99f6e4",
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0d9488",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 6,
  },
  legendSymbol: {
    fontSize: 10,
    fontWeight: "bold",
    width: 36,
    marginRight: 6,
  },
  legendText: {
    flex: 1,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  legendDesc: {
    fontSize: 8,
    color: "#6b7280",
  },
  tierIcon: {
    width: 24,
    height: 24,
  },
  tierIconLarge: {
    width: 32,
    height: 32,
  },
});

// Helper to generate growth tier display for criteria (text only for inline use)
const getCriteriaGrowthDisplay = (score: number): string => {
  const tier = criteriaScoreToGrowthTier(score);
  return tier.label;
};

// Helper to generate growth tier display for overall score (text only for inline use)
const getOverallGrowthDisplay = (score: number): string => {
  const tier = scoreToGrowthTier(score);
  return tier.label;
};

// Helper to get tier symbol info
const getTierSymbol = (score: number): { symbol: string; color: string } => {
  const tier = scoreToGrowthTier(score);
  return TIER_SYMBOLS[tier.tier];
};

// Helper to get score circle style - now uses consistent encouraging colors
const getScoreStyle = () => {
  // All tiers use encouraging teal/green colors
  return styles.scoreCircleHigh;
};

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
  isLoading?: boolean;
}

interface RankedConcept {
  note: StickyNote;
  score: number;
  ratings: SelfEvaluationRating[];
  aiEval?: AIConceptEvaluation;
}

interface SummaryPDFProps {
  hmwStatement: string;
  rankedConcepts: RankedConcept[];
  aiInsight: string | null;
  generatedDate: string;
}

export const SummaryPDF = ({
  hmwStatement,
  rankedConcepts,
  aiInsight,
  generatedDate,
}: SummaryPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Design Concept Summary</Text>
        <Text style={styles.subtitle}>Generated: {generatedDate}</Text>
      </View>

      {/* Design Challenge */}
      <View style={styles.challengeSection}>
        <Text style={styles.challengeLabel}>Design Challenge</Text>
        <Text style={styles.challengeText}>{hmwStatement}</Text>
      </View>

      {/* Ranked Concepts */}
      {rankedConcepts.map((item, idx) => (
        <View
          key={item.note.id}
          style={idx === 0 ? styles.conceptCardFirst : styles.conceptCard}
          wrap={false}
        >
          {/* Header Row */}
          <View style={styles.conceptHeader}>
            {/* Rank Badge */}
            <View style={idx === 0 ? styles.rankBadgeFirst : styles.rankBadge}>
              <Text style={styles.rankNumber}>#{idx + 1}</Text>
            </View>

            {/* Concept Info */}
            <View style={styles.conceptInfo}>
              <Text style={styles.conceptTitle}>
                {idx === 0 ? "[TOP] " : ""}
                {item.note.text}
              </Text>
              {item.note.details && (
                <Text style={styles.conceptDetails}>
                  {item.note.details.slice(0, 200)}
                  {item.note.details.length > 200 ? "..." : ""}
                </Text>
              )}
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, getScoreStyle()]}>
                <Text
                  style={[
                    styles.scoreText,
                    { color: getTierSymbol(item.score).color },
                  ]}
                >
                  {getTierSymbol(item.score).symbol}
                </Text>
              </View>
              <Text style={styles.scoreLabel}>
                {scoreToGrowthTier(item.score).label}
              </Text>
            </View>
          </View>

          {/* Images */}
          {(item.note.image?.dataUrl || item.note.drawing?.dataUrl) && (
            <View style={styles.imageContainer}>
              {item.note.image?.dataUrl && (
                <Image
                  src={item.note.image.dataUrl}
                  style={styles.conceptImage}
                />
              )}
              {item.note.drawing?.dataUrl && (
                <Image
                  src={item.note.drawing.dataUrl}
                  style={styles.conceptImage}
                />
              )}
            </View>
          )}

          {/* Self Ratings */}
          <View style={styles.ratingsSection}>
            <Text style={styles.ratingsLabel}>Self-Assessment</Text>
            <View style={styles.ratingsGrid}>
              {SELF_EVAL_CRITERIA.map((criteria) => {
                const rating = item.ratings.find(
                  (r) => r.criteriaId === criteria.id
                );
                return (
                  <View key={criteria.id} style={styles.ratingItem}>
                    <Text style={styles.ratingEmoji}>{criteria.label}:</Text>
                    <Text style={styles.ratingStars}>
                      {rating ? getCriteriaGrowthDisplay(rating.score) : "-"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Evaluation */}
          {item.aiEval && !item.aiEval.isLoading && (
            <View style={styles.aiSection}>
              <Text style={styles.aiLabel}>
                AI Feedback ({getOverallGrowthDisplay(item.aiEval.overallScore)}
                )
              </Text>

              {/* Criteria scores */}
              <View>
                <Text style={styles.aiCriteria}>
                  Problem Fit:{" "}
                  {getCriteriaGrowthDisplay(
                    item.aiEval.criteria.problemFit.score
                  )}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.problemFit.feedback}
                </Text>

                <Text style={styles.aiCriteria}>
                  Originality:{" "}
                  {getCriteriaGrowthDisplay(
                    item.aiEval.criteria.originality.score
                  )}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.originality.feedback}
                </Text>

                <Text style={styles.aiCriteria}>
                  Feasibility:{" "}
                  {getCriteriaGrowthDisplay(
                    item.aiEval.criteria.feasibility.score
                  )}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.feasibility.feedback}
                </Text>
              </View>

              {/* Strengths & Improvements */}
              <View style={styles.strengthsImprovements}>
                <View style={styles.strengthsBox}>
                  <Text style={[styles.boxLabel, { color: "#059669" }]}>
                    Strengths
                  </Text>
                  {item.aiEval.strengths.map((s, i) => (
                    <Text key={i} style={styles.boxItem}>
                      • {s}
                    </Text>
                  ))}
                </View>
                <View style={styles.improvementsBox}>
                  <Text style={[styles.boxLabel, { color: "#d97706" }]}>
                    Improvements
                  </Text>
                  {item.aiEval.improvements.map((s, i) => (
                    <Text key={i} style={styles.boxItem}>
                      • {s}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* AI Insight */}
      {aiInsight && (
        <View style={styles.insightSection} wrap={false}>
          <Text style={styles.insightLabel}>AI Insight</Text>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      )}

      {/* Next Steps */}
      <View style={styles.nextStepsSection} wrap={false}>
        <Text style={styles.nextStepsLabel}>Next Steps</Text>
        <Text style={styles.nextStepItem}>
          1. Review the AI feedback and your self-ratings
        </Text>
        <Text style={styles.nextStepItem}>
          2. Consider strengthening your top concept's weak areas
        </Text>
        <Text style={styles.nextStepItem}>
          3. Prepare to present and defend your chosen concept
        </Text>
      </View>

      {/* Growth Stages Legend */}
      <View style={styles.legendSection} wrap={false}>
        <Text style={styles.legendLabel}>Growth Stages Guide</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <Text
              style={[styles.legendSymbol, { color: TIER_SYMBOLS.seed.color }]}
            >
              {TIER_SYMBOLS.seed.symbol}
            </Text>
            <View style={styles.legendText}>
              <Text style={styles.legendTitle}>Seed</Text>
              <Text style={styles.legendDesc}>
                Needs more detail to evaluate
              </Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <Text
              style={[
                styles.legendSymbol,
                { color: TIER_SYMBOLS.sprout.color },
              ]}
            >
              {TIER_SYMBOLS.sprout.symbol}
            </Text>
            <View style={styles.legendText}>
              <Text style={styles.legendTitle}>Sprout</Text>
              <Text style={styles.legendDesc}>
                On the right track, keep developing
              </Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <Text
              style={[styles.legendSymbol, { color: TIER_SYMBOLS.tree.color }]}
            >
              {TIER_SYMBOLS.tree.symbol}
            </Text>
            <View style={styles.legendText}>
              <Text style={styles.legendTitle}>Tree</Text>
              <Text style={styles.legendDesc}>
                Well-developed, solid foundation
              </Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <Text
              style={[
                styles.legendSymbol,
                { color: TIER_SYMBOLS.forest.color },
              ]}
            >
              {TIER_SYMBOLS.forest.symbol}
            </Text>
            <View style={styles.legendText}>
              <Text style={styles.legendTitle}>Forest</Text>
              <Text style={styles.legendDesc}>Excellent, ready to present</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Generated by Volition</Text>
    </Page>
  </Document>
);

export default SummaryPDF;
