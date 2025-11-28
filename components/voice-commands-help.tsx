"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface VoiceCommandsHelpProps {
  className?: string;
  compact?: boolean; // allow smaller style if needed
}

export function VoiceCommandsHelp({
  className = "",
  compact = false,
}: VoiceCommandsHelpProps) {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.96 }}
        className={`bg-white border-2 border-blue-200 rounded-xl shadow-lg p-3 ${
          compact ? "text-xs w-52" : "text-sm w-64"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          <p className="font-bold text-gray-700">🎤 Voice Commands</p>
        </div>
        <p className={`text-xs text-gray-500 mb-2 ${compact ? "hidden" : ""}`}>
          Tip: Hold <strong>Space</strong> or press-and-hold the microphone to
          record.
        </p>
        <ul
          className={`space-y-1.5 text-gray-600 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            <span>
              <strong>Save this</strong> — Create note
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            <span>
              <strong>Next question</strong> — Ask AI
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            <span>
              <strong>Delve deeper</strong> — Explore idea
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500">•</span>
            <span>
              <strong>Mark as concept</strong> — Promote
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
