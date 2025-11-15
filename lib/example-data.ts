import { SessionState, StickyNote, AIQuestion } from "./types";

// Example data for "Try with an example" feature
export const EXAMPLE_SESSION_DATA: Partial<SessionState> = {
  hmwStatement:
    "How might we help college students manage stress during exam periods?",
  currentPhase: "canvas",
  notes: [
    {
      id: "note-1",
      text: "Students often feel overwhelmed with multiple exams happening at once",
      x: 120,
      y: 100,
      color: "#fef3c7", // yellow
      isConcept: false,
      createdAt: Date.now() - 10000,
    },
    {
      id: "note-2",
      text: "Study Planner with Pomodoro Timer",
      x: 450,
      y: 120,
      color: "#bfdbfe", // blue
      isConcept: true,
      details:
        "Problem: Students struggle to break down large amounts of study material into manageable sessions, leading to cramming and burnout during exam periods.\n\nSolution: An app that uses the Pomodoro technique (25-minute focused sessions with 5-minute breaks) and automatically schedules study sessions based on exam dates and subject priorities.\n\nUser Value: Reduces overwhelm by making study time feel manageable, improves retention through spaced repetition, and helps students feel more in control of their preparation. No more all-nighters!\n\nImplementation: Build as a mobile app with calendar integration. Include task breakdown wizard, progress tracking dashboard, and smart notifications. Start with a simple MVP focusing on timer and schedule features.",
      createdAt: Date.now() - 9000,
    },
    {
      id: "note-3",
      text: "Peer support groups struggle to coordinate meeting times",
      x: 150,
      y: 320,
      color: "#fecaca", // red
      isConcept: false,
      createdAt: Date.now() - 8000,
    },
    {
      id: "note-4",
      text: "Virtual Study Rooms with Accountability Partners",
      x: 780,
      y: 140,
      color: "#bbf7d0", // green
      isConcept: true,
      details:
        "Problem: Students studying alone often lose motivation and feel isolated, especially when peer support groups struggle to coordinate meeting times.\n\nSolution: A platform that matches students studying for similar subjects and creates virtual study rooms. Features include shared study schedules, video call integration, and mutual check-ins to keep each other accountable.\n\nUser Value: Reduces isolation and procrastination through peer support, increases motivation knowing someone else is counting on you, and makes studying more enjoyable through social connection.\n\nImplementation: Web-based platform with simple matching algorithm based on course/subject. Integrate with Zoom or build basic video functionality. Include scheduling calendar and notification system for study session reminders.",
      createdAt: Date.now() - 7000,
    },
    {
      id: "note-5",
      text: "Students don't know effective study techniques for different subjects",
      x: 140,
      y: 520,
      color: "#fef3c7", // yellow
      isConcept: false,
      createdAt: Date.now() - 6000,
    },
    {
      id: "note-6",
      text: "Mindfulness breaks are often forgotten during intense study sessions",
      x: 480,
      y: 360,
      color: "#fbcfe8", // pink
      isConcept: false,
      createdAt: Date.now() - 5000,
    },
    {
      id: "note-7",
      text: "Mindful Study Break App",
      x: 800,
      y: 380,
      color: "#e9d5ff", // purple
      isConcept: true,
      details:
        "Problem: Students forget to take breaks during intense study sessions, leading to mental fatigue, stress buildup, and decreased retention over time.\n\nSolution: An app that integrates with study timers and automatically prompts students to take 2-5 minute mindfulness breaks. Offers guided meditations, breathing exercises, progressive muscle relaxation, and stress-relief visualizations tailored for exam stress.\n\nUser Value: Prevents burnout by ensuring regular mental breaks, reduces anxiety through proven relaxation techniques, and improves focus and retention when returning to study. Students feel calmer and more balanced.\n\nImplementation: Mobile app with timer integration APIs, library of 50+ guided audio sessions recorded by wellness experts, customizable break intervals, and offline mode for library use. Partner with university counseling centers for content validation.",
      createdAt: Date.now() - 4000,
    },
    {
      id: "note-8",
      text: "Library spaces are often too crowded during exam season",
      x: 160,
      y: 720,
      color: "#bfdbfe", // blue
      isConcept: false,
      createdAt: Date.now() - 3000,
    },
    {
      id: "note-9",
      text: "Students lose track of their materials across different courses",
      x: 520,
      y: 560,
      color: "#bbf7d0", // green
      isConcept: false,
      createdAt: Date.now() - 2000,
    },
  ] as StickyNote[],
  questions: [
    {
      id: "q-1",
      text: "What are the main challenges college students face during exam periods?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 11000,
    },
    {
      id: "q-2",
      text: "What tools or apps do students currently use to manage exam stress?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 10500,
    },
    {
      id: "q-3",
      text: "What would make students feel more in control during exam season?",
      fromAI: true,
      answered: true,
      timestamp: Date.now() - 9500,
    },
    {
      id: "q-4",
      text: "How do students currently connect with peers for study support?",
      fromAI: true,
      answered: false,
      timestamp: Date.now() - 8500,
    },
  ] as AIQuestion[],
};
