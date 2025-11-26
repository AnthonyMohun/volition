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
} from "@/lib/types";

// Register a font (optional - using Helvetica as default)
Font.register({
  family: "Helvetica",
  fonts: [{ src: "Helvetica" }, { src: "Helvetica-Bold", fontWeight: "bold" }],
});

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
    color: "#3b82f6",
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
    color: "#4b5563",
    flex: 1,
  },
  aiFeedback: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
    marginLeft: 16,
    marginBottom: 6,
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
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#3b82f6",
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
});

// Helper to generate star string
const getStars = (score: number): string => {
  return "★".repeat(score) + "☆".repeat(5 - score);
};

// Helper to get score circle style
const getScoreStyle = (score: number) => {
  if (score >= 80) return styles.scoreCircleHigh;
  if (score >= 60) return styles.scoreCircleMedium;
  return styles.scoreCircleLow;
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
        <Text style={styles.title}>🎯 Design Concept Summary</Text>
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
                {idx === 0 ? "👑 " : ""}
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
              <View style={[styles.scoreCircle, getScoreStyle(item.score)]}>
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
              <Text style={styles.scoreLabel}>Your Score</Text>
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
                    <Text style={styles.ratingEmoji}>{criteria.emoji}</Text>
                    <Text style={styles.ratingStars}>
                      {rating ? getStars(rating.score) : "—"}
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
                AI Evaluation (Score: {item.aiEval.overallScore}/100)
              </Text>

              {/* Criteria scores */}
              <View>
                <Text style={styles.aiCriteria}>
                  🎯 Problem Fit:{" "}
                  {getStars(item.aiEval.criteria.problemFit.score)}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.problemFit.feedback}
                </Text>

                <Text style={styles.aiCriteria}>
                  ✨ Originality:{" "}
                  {getStars(item.aiEval.criteria.originality.score)}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.originality.feedback}
                </Text>

                <Text style={styles.aiCriteria}>
                  🛠️ Feasibility:{" "}
                  {getStars(item.aiEval.criteria.feasibility.score)}
                </Text>
                <Text style={styles.aiFeedback}>
                  {item.aiEval.criteria.feasibility.feedback}
                </Text>
              </View>

              {/* Strengths & Improvements */}
              <View style={styles.strengthsImprovements}>
                <View style={styles.strengthsBox}>
                  <Text style={[styles.boxLabel, { color: "#059669" }]}>
                    ✓ Strengths
                  </Text>
                  {item.aiEval.strengths.map((s, i) => (
                    <Text key={i} style={styles.boxItem}>
                      • {s}
                    </Text>
                  ))}
                </View>
                <View style={styles.improvementsBox}>
                  <Text style={[styles.boxLabel, { color: "#d97706" }]}>
                    ↑ Improvements
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
          <Text style={styles.insightLabel}>🤖 AI Insight</Text>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      )}

      {/* Next Steps */}
      <View style={styles.nextStepsSection} wrap={false}>
        <Text style={styles.nextStepsLabel}>📝 Next Steps</Text>
        <Text style={styles.nextStepItem}>
          1. Review the AI feedback and your self-ratings
        </Text>
        <Text style={styles.nextStepItem}>
          2. Consider strengthening your top concept&apos;s weak areas
        </Text>
        <Text style={styles.nextStepItem}>
          3. Prepare to present and defend your chosen concept
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Generated by Socratic Design App</Text>
    </Page>
  </Document>
);

export default SummaryPDF;
