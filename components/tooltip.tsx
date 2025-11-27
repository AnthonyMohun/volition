"use client";

import React, { useEffect, useRef, useState } from "react";

interface TooltipProps {
  children: React.ReactNode; // the trigger element
  content: React.ReactNode; // tooltip content
  placement?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ children, content, placement = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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

  // On touch devices, a click/tap should toggle the tooltip. On non-touch, hover and focus.
  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        // Prevent toggling if user is using mouse hover — e.g. avoid double triggers.
        // But on mobile, click should toggle visible state.
        setOpen((s) => !s);
        // Allow click events to bubble if children have handlers
      }}
    >
      {children}

      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!open}
        className={`z-50 pointer-events-none transition-opacity duration-150 ${
          open ? "opacity-100" : "opacity-0"
        } absolute whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg drop-shadow-lg transform-gpu` +
          (placement === "top"
            ? " bottom-full left-1/2 -translate-x-1/2 mb-3"
            : placement === "bottom"
            ? " top-full left-1/2 -translate-x-1/2 mt-3"
            : placement === "left"
            ? " right-full top-1/2 -translate-y-1/2 mr-3"
            : " left-full top-1/2 -translate-y-1/2 ml-3")
        }
      >
        <div className="relative">
          {content}
          {/* small arrow */}
          <span
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45` +
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
      </div>
    </div>
  );
}
