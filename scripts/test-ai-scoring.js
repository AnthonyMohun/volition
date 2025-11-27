// Quick test harness to simulate adjustAIEvalScore logic

function clampScore(s) {
  if (typeof s !== "number") return 1;
  return Math.max(1, Math.min(5, Math.round(s)));
}

function adjustAI(parsed, noteDetails) {
  // Normalize
  parsed.problemFit.score = clampScore(parsed.problemFit.score);
  parsed.originality.score = clampScore(parsed.originality.score);
  parsed.feasibility.score = clampScore(parsed.feasibility.score);

  const MIN_DETAILS_LENGTH = 40;
  const isIncomplete =
    !noteDetails || noteDetails.trim().length < MIN_DETAILS_LENGTH;
  if (isIncomplete) {
    parsed.problemFit.score = Math.min(parsed.problemFit.score, 2);
    parsed.feasibility.score = Math.min(parsed.feasibility.score, 2);
    parsed.originality.score = Math.min(parsed.originality.score, 3);
  }

  const recomputedOverall = Math.round(
    ((parsed.problemFit.score +
      parsed.originality.score +
      parsed.feasibility.score) /
      15) *
      100
  );
  const completenessMultiplier = isIncomplete ? 0.5 : 1.0;
  let adjusted = Math.round(recomputedOverall * completenessMultiplier);
  if (isIncomplete) adjusted = Math.min(adjusted, 40);
  return { parsed, recomputedOverall, adjusted };
}

// Simulate a title-only concept
const titleOnly = { text: "New note..." };
const parsedRes = {
  problemFit: { score: 4, feedback: "looks ok" },
  originality: { score: 4, feedback: "cool" },
  feasibility: { score: 4, feedback: "could work" },
};
console.log(
  "Title-only note ->",
  adjustAI(parsedRes, titleOnly.details || titleOnly.text)
);

// Simulate a detailed concept
const parsedDet = {
  problemFit: { score: 5, feedback: "fits well" },
  originality: { score: 4, feedback: "good" },
  feasibility: { score: 5, feedback: "doable" },
};
const details =
  "This is a detailed description that explains the concept, what problem it addresses, and how it will be implemented.";
console.log("Detailed note ->", adjustAI(parsedDet, details));
