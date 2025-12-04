"use client";

import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "./reveal-theme.css";

import {
  CoverSlide,
  MappingSlide,
  WhatIsSlide,
  WhoForSlide,
  HowToUse1Slide,
  HowToUse2Slide,
  HowToUse3Slide,
  HowToUse4Slide,
  DifferentiatorsSlide,
  ProcessComparisonSlide,
  SuccessSlide,
  UserStorySlide,
  DemoSlide,
} from "./slides";

export default function PresentationPage() {
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal.Api | null>(null);

  useEffect(() => {
    if (!deckRef.current || revealRef.current) return;

    const deck = new Reveal(deckRef.current, {
      // Presentation settings
      width: 1920,
      height: 1080,
      margin: 0.08,
      minScale: 0.2,
      maxScale: 2.0,

      // Controls - disabled for cleaner look
      controls: false,
      controlsTutorial: false,
      controlsLayout: "bottom-right",
      controlsBackArrows: "faded",

      // Progress
      progress: true,
      slideNumber: true,

      // Navigation
      hash: true,
      hashOneBasedIndex: true,
      respondToHashChanges: true,
      history: true,
      keyboard: true,
      touch: true,
      loop: false,

      // Transitions
      transition: "slide",
      transitionSpeed: "default",
      backgroundTransition: "fade",

      // Auto-slide disabled (manual control)
      autoSlide: 0,

      // Center content
      center: true,

      // Overview mode
      overview: true,

      // Fragment settings
      fragments: true,

      // Embedded mode
      embedded: false,

      // Help overlay
      help: true,

      // Auto-animate
      autoAnimate: true,
    });

    deck.initialize().then(() => {
      revealRef.current = deck;
    });

    return () => {
      if (revealRef.current) {
        revealRef.current.destroy();
        revealRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* Fullscreen hint */}
      <div className="fullscreen-hint">
        Press <kbd>F</kbd> for fullscreen
      </div>

      {/* Reveal.js container */}
      <div className="reveal" ref={deckRef}>
        <div className="slides">
          <section data-transition="slide">
            <div className="slide-container">
              <CoverSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <MappingSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <WhatIsSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <WhoForSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <HowToUse1Slide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <HowToUse2Slide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <HowToUse3Slide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <HowToUse4Slide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <DifferentiatorsSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <ProcessComparisonSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <SuccessSlide />
            </div>
          </section>
          <section data-transition="slide">
            <div className="slide-container">
              <UserStorySlide />
            </div>
          </section>
          <section data-transition="fade">
            <DemoSlide />
          </section>
        </div>
      </div>
    </>
  );
}
