"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode; // the trigger element
  content: React.ReactNode; // tooltip content
  placement?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  children,
  content,
  placement = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipId] = useState(
    () => `tooltip-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        open &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Compute tooltip position in viewport coordinates when open
  useEffect(() => {
    function update() {
      if (!wrapperRef.current || !tooltipRef.current || !open) return;

      const triggerRect = wrapperRef.current.getBoundingClientRect();
      const ttEl = tooltipRef.current;
      const ttWidth = ttEl.offsetWidth;
      const ttHeight = ttEl.offsetHeight;

      let left = 0;
      let top = 0;
      const gap = 8; // px gap between trigger and tooltip

      if (placement === "top") {
        left = triggerRect.left + triggerRect.width / 2 - ttWidth / 2;
        top = triggerRect.top - ttHeight - gap;
      } else if (placement === "bottom") {
        left = triggerRect.left + triggerRect.width / 2 - ttWidth / 2;
        top = triggerRect.bottom + gap;
      } else if (placement === "left") {
        left = triggerRect.left - ttWidth - gap;
        top = triggerRect.top + triggerRect.height / 2 - ttHeight / 2;
      } else {
        left = triggerRect.right + gap;
        top = triggerRect.top + triggerRect.height / 2 - ttHeight / 2;
      }

      // Keep tooltip within viewport horizontally
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 6;
      if (left < padding) left = padding;
      if (left + ttWidth > viewportWidth - padding)
        left = Math.max(padding, viewportWidth - ttWidth - padding);

      // If it runs off top, flip to bottom
      if (top < padding && placement === "top") {
        top = triggerRect.bottom + gap;
      }

      // If it runs off bottom, flip to top
      if (top + ttHeight > viewportHeight - padding && placement === "bottom") {
        top = triggerRect.top - ttHeight - gap;
      }

      // Clamp within viewport vertically to prevent clipping by headers
      if (top < padding) top = padding;
      if (top + ttHeight > viewportHeight - padding)
        top = Math.max(padding, viewportHeight - ttHeight - padding);

      setCoords({ left, top });
    }

    if (open) {
      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, placement]);

  // Positioning via portal to avoid clipping by parent elements with overflow hidden.
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(
    null
  );
  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        // Toggle on click/tap (useful for touch devices)
        setOpen((s) => !s);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((s) => !s);
        }
      }}
      role="button"
      aria-pressed={open}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            aria-hidden={!open}
            className={`z-50 pointer-events-auto transition-opacity duration-150 ${
              open ? "opacity-100" : "opacity-0"
            } bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg drop-shadow-lg transform-gpu max-w-xs whitespace-normal`}
            style={{
              position: "fixed",
              left: coords?.left ?? -9999,
              top: coords?.top ?? -9999,
              zIndex: 9999,
            }}
          >
            <div className="relative">
              {content}
              <span
                className={
                  `absolute w-2 h-2 bg-gray-900 transform rotate-45` +
                  (placement === "top"
                    ? " left-1/2 -translate-x-1/2 bottom-[-6px]"
                    : placement === "bottom"
                    ? " left-1/2 -translate-x-1/2 top-[-6px]"
                    : placement === "left"
                    ? " right-[-6px] top-1/2 -translate-y-1/2"
                    : " left-[-6px] top-1/2 -translate-y-1/2")
                }
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
