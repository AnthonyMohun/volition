import { SessionState, StickyNote, AIQuestion } from "./types";

// Layout helpers: compute positions for example notes in a tidy radial layout
const CANVAS_CENTER_X = 2000;
const CANVAS_CENTER_Y = 1500;

function positionedNotes(rawNotes: Omit<StickyNote, "x" | "y">[]) {
  const conceptNotes = rawNotes.filter((n) => n.isConcept);
  const otherNotes = rawNotes.filter((n) => !n.isConcept);

  const innerRadius = 240; // concept ring
  const outerRadius = 520; // other notes ring

  const positionedConcepts: StickyNote[] = conceptNotes.map((note, i) => {
    const angle = (i / conceptNotes.length) * Math.PI * 2 - Math.PI / 2; // start at top
    const x = Math.round(CANVAS_CENTER_X + Math.cos(angle) * innerRadius);
    const y = Math.round(CANVAS_CENTER_Y + Math.sin(angle) * innerRadius);
    return { ...note, x, y } as StickyNote;
  });

  const positionedOthers: StickyNote[] = otherNotes.map((note, i) => {
    const angle = (i / otherNotes.length) * Math.PI * 2 + Math.PI / 6; // offset to avoid overlap
    const x = Math.round(CANVAS_CENTER_X + Math.cos(angle) * outerRadius);
    const y = Math.round(CANVAS_CENTER_Y + Math.sin(angle) * outerRadius);
    return { ...note, x, y } as StickyNote;
  });

  const merged: StickyNote[] = [];
  rawNotes.forEach((n) => {
    const c = positionedConcepts.find((c) => c.id === n.id);
    if (c) merged.push(c);
    else {
      const o = positionedOthers.find((o) => o.id === n.id);
      if (o) merged.push(o);
    }
  });

  return merged;
}

// Example data for "Try with an example" feature
export const EXAMPLE_SESSION_DATA: Partial<SessionState> = {
  hmwStatement:
    "How might we help dogs feel less alone when their owners in college?",
  currentPhase: "canvas",
  notes: positionedNotes([
    {
      id: "note-1",
      text: "Dogs often show signs of separation anxiety when left alone during long college days",
      color: "#fef3c7", // yellow
      isConcept: false,
      createdAt: Date.now() - 10000,
    },
    {
      id: "note-2",
      text: "Interactive Treat-Dispensing Companion Robot",
      color: "#bfdbfe", // blue
      isConcept: true,
      details:
        "Description: A small robot that moves around the house, dispenses treats at random intervals, and plays calming sounds or the owner's voice recordings. The robot can detect when the dog is nearby and engage with them through movement and sounds.\n\nExtras: Includes a companion app for owners to check in and manually trigger interactions.",
      targetAudience: "College students with dogs",
      platform: ["Mobile", "Web"],
      keyBenefits:
        "Reduces separation anxiety, provides mental stimulation, keeps dogs active",
      mainFeatures:
        "Treat dispensing, voice playback, movement patterns, owner app integration",
      createdAt: Date.now() - 9000,
    },
    {
      id: "note-3",
      text: "Many owners feel guilty leaving their dogs home alone",
      color: "#fecaca", // red
      isConcept: false,
      createdAt: Date.now() - 8000,
    },
    {
      id: "note-4",
      text: "Doggy Daycare Matching App",
      color: "#bbf7d0", // green
      isConcept: true,
      details:
        "Description: An app that connects dog owners in the same neighborhood to share pet-sitting duties. Users can browse profiles of nearby dogs, arrange playdates, and coordinate care schedules so dogs have company during class hours.\n\nExtras: Includes rating system and verified user profiles for safety.",
      targetAudience: "College students in dorms or apartments",
      platform: ["Mobile"],
      keyBenefits:
        "Socialization for dogs, cost-effective alternative to daycare, community building",
      mainFeatures:
        "Location-based matching, scheduling, messaging, ratings and reviews",
      createdAt: Date.now() - 7000,
    },
    {
      id: "note-5",
      text: "Dogs need mental stimulation to prevent destructive behavior",
      color: "#fef3c7", // yellow
      isConcept: false,
      createdAt: Date.now() - 6000,
    },
    {
      id: "note-6",
      text: "Background noise and familiar sounds can help calm anxious dogs",
      color: "#fbcfe8", // pink
      isConcept: false,
      createdAt: Date.now() - 5000,
    },
    {
      id: "note-7",
      text: "Video call system for dogs",
      color: "#dcfce7", // teal
      isConcept: false,
      details: "Basic idea - owners could video call their dogs during breaks",
      createdAt: Date.now() - 4000,
    },
    {
      id: "note-8",
      text: "Dogs thrive on routine and predictability",
      color: "#bfdbfe", // blue
      isConcept: false,
      createdAt: Date.now() - 3000,
    },
    {
      id: "note-9",
      text: "Some dogs respond well to puzzle toys that dispense food slowly",
      color: "#bbf7d0", // green
      isConcept: false,
      createdAt: Date.now() - 2000,
    },
  ]) as StickyNote[],
  questions: [
    {
      id: "q-1",
      text: "What are the main signs of separation anxiety in dogs?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 11000,
    },
    {
      id: "q-2",
      text: "How long are dogs typically left alone during a workday?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 10500,
    },
    {
      id: "q-3",
      text: "What currently helps dogs feel less anxious when owners leave?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 9500,
    },
  ] as AIQuestion[],
};
