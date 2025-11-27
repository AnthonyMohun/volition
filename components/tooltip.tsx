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
  const [tooltipId] = useState(() => `tooltip-${Math.random().toString(36).slice(2)}`);

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

      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={`z-50 pointer-events-none transition-opacity duration-150 ${
          open ? "opacity-100" : "opacity-0"
          } absolute whitespace-normal max-w-xs bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg drop-shadow-lg transform-gpu` +
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
