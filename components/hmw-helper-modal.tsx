"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface HMWHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (statement: string) => void;
}

const TEMPLATES = [
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Help a specific group access something",
    blanks: [
      {
        key: "userGroup",
        label: "What user group or community?",
        placeholder: "e.g., people with hearing impairments",
      },
      {
        key: "product",
        label: "What product or service?",
        placeholder: "e.g., our mobile app",
      },
      {
        key: "barrier",
        label: "What barrier do they face?",
        placeholder: "e.g., can't receive audio notifications",
      },
    ],
    template: (blanks: Record<string, string>) =>
      `How might we help ${blanks.userGroup || "[user group]"} access ${
        blanks.product || "[product]"
      } when they ${blanks.barrier || "[face this barrier]"}?`,
  },
  {
    id: "experience",
    label: "Experience",
    description: "Improve how someone feels about a task",
    blanks: [
      {
        key: "userGroup",
        label: "Who are we designing for?",
        placeholder: "e.g., students",
      },
      {
        key: "activity",
        label: "What activity are they doing?",
        placeholder: "e.g., studying for exams",
      },
      {
        key: "feeling",
        label: "What should they feel instead?",
        placeholder: "e.g., more confident and organized",
      },
    ],
    template: (blanks: Record<string, string>) =>
      `How might we help ${blanks.userGroup || "[user group]"} feel ${
        blanks.feeling || "[emotion]"
      } when ${blanks.activity || "[doing activity]"}?`,
  },
  {
    id: "efficiency",
    label: "Efficiency",
    description: "Help someone do something faster or easier",
    blanks: [
      {
        key: "userGroup",
        label: "Who is struggling?",
        placeholder: "e.g., busy professionals",
      },
      {
        key: "task",
        label: "What task is taking too long?",
        placeholder: "e.g., managing emails",
      },
      {
        key: "goal",
        label: "What's the ideal outcome?",
        placeholder: "e.g., spend less than 10 minutes per day",
      },
    ],
    template: (blanks: Record<string, string>) =>
      `How might we help ${blanks.userGroup || "[user group]"} accomplish ${
        blanks.task || "[task]"
      } so they can ${blanks.goal || "[achieve goal]"}?`,
  },
  {
    id: "sustainability",
    label: "Sustainability",
    description: "Reduce waste or environmental impact",
    blanks: [
      {
        key: "action",
        label: "What action causes waste?",
        placeholder: "e.g., single-use packaging",
      },
      {
        key: "userGroup",
        label: "Who does this action?",
        placeholder: "e.g., online shoppers",
      },
      {
        key: "alternative",
        label: "What's a better alternative?",
        placeholder: "e.g., reusable packaging",
      },
    ],
    template: (blanks: Record<string, string>) =>
      `How might we help ${blanks.userGroup || "[user group]"} reduce ${
        blanks.action || "[waste]"
      } by ${blanks.alternative || "[doing something better]"}?`,
  },
  {
    id: "connection",
    label: "Connection",
    description: "Help people connect or feel part of a community",
    blanks: [
      {
        key: "userGroup",
        label: "Who should connect?",
        placeholder: "e.g., remote team members",
      },
      {
        key: "shared",
        label: "What do they share in common?",
        placeholder: "e.g., same projects or interests",
      },
      {
        key: "benefit",
        label: "What's the benefit of connecting?",
        placeholder: "e.g., feel more like a team",
      },
    ],
    template: (blanks: Record<string, string>) =>
      `How might we help ${blanks.userGroup || "[user group]"} feel ${
        blanks.benefit || "[connected]"
      } around ${blanks.shared || "[shared interest]"}?`,
  },
];

export function HMWHelperModal({
  isOpen,
  onClose,
  onSelect,
}: HMWHelperModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [blanks, setBlanks] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);
  const isComplete =
    template && template.blanks.every((blank) => blanks[blank.key]?.trim());
  const generatedStatement = template ? template.template(blanks) : "";

  const handleReset = () => {
    setSelectedTemplate(null);
    setBlanks({});
  };

  const handleSubmit = () => {
    if (isComplete) {
      onSelect(generatedStatement);
      handleReset();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">HMW Builder</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Build your "How Might We" statement with guided templates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!selectedTemplate ? (
            <>
              <p className="text-gray-400 text-sm">
                Choose a template that fits your design challenge. We'll guide
                you through filling in the blanks.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      setBlanks({});
                    }}
                    className="group p-4 glass-light rounded-lg border border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-left"
                  >
                    <h3 className="font-semibold text-gray-200 group-hover:text-purple-300 transition-colors">
                      {tmpl.label}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {tmpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={handleReset}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                ← Back to Templates
              </button>

              {/* Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-200">
                  {template?.label} Challenge
                </h3>

                {template?.blanks.map((blank) => (
                  <div key={blank.key}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {blank.label}
                    </label>
                    <input
                      type="text"
                      value={blanks[blank.key] || ""}
                      onChange={(e) =>
                        setBlanks((prev) => ({
                          ...prev,
                          [blank.key]: e.target.value,
                        }))
                      }
                      placeholder={blank.placeholder}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder:text-gray-600 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="p-4 glass-light rounded-lg border border-purple-500/30 bg-purple-500/10">
                <p className="text-xs uppercase tracking-wide text-purple-300 font-medium mb-2">
                  Your Statement
                </p>
                <p className="text-gray-100 text-sm leading-relaxed">
                  {generatedStatement}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-900 transition-colors font-medium"
                >
                  Start Over
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComplete ? "Use This Statement" : "Fill in all fields"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
