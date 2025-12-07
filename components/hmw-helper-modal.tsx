import { useState } from "react";
import {
  X,
  Accessibility,
  Heart,
  Zap,
  Leaf,
  Users,
  Shuffle,
} from "lucide-react";

interface HMWHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (statement: string) => void;
}

const TEMPLATES = [
  {
    id: "accessibility",
    icon: Accessibility,
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
    icon: Heart,
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
    icon: Zap,
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
    icon: Leaf,
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
    icon: Users,
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
  {
    id: "random",
    icon: Shuffle,
    label: "Random Example",
    description: "Get a random pre-written HMW statement for inspiration",
    blanks: [],
    template: () => "",
    isRandom: true,
  },
];

const EXAMPLE_HMWS = [
  "How might we help students manage their time more effectively?",
  "How might we help people with hearing impairments access our mobile app when they can't receive audio notifications?",
  "How might we help busy professionals accomplish managing emails so they can spend less than 10 minutes per day?",
  "How might we help remote team members feel more like a team around same projects or interests?",
  "How might we help online shoppers reduce single-use packaging by using reusable packaging?",
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
  const isRandom = template && "isRandom" in template && template.isRandom;
  const isComplete =
    template &&
    !isRandom &&
    template.blanks.every((blank) => blanks[blank.key]?.trim());
  const generatedStatement =
    template && !isRandom ? template.template(blanks) : "";

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
    <div className="fixed inset-0 bg-indigo-900/20 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800">
              HMW Builder
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-medium">
              Build your "How Might We" statement with guided templates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {!selectedTemplate ? (
            <>
              <p className="text-gray-600 text-sm font-medium">
                Choose a template that fits your design challenge. We'll guide
                you through filling in the blanks.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {TEMPLATES.map((tmpl) => {
                  const IconComponent = tmpl.icon;
                  const isRandomOption = "isRandom" in tmpl && tmpl.isRandom;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        if (isRandomOption) {
                          // Select random HMW and close modal
                          const randomIndex = Math.floor(
                            Math.random() * EXAMPLE_HMWS.length
                          );
                          onSelect(EXAMPLE_HMWS[randomIndex]);
                        } else {
                          setSelectedTemplate(tmpl.id);
                          setBlanks({});
                        }
                      }}
                      className="group p-3 md:p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left touch-manipulation active:scale-98"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                          <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors text-sm md:text-base">
                            {tmpl.label}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 font-medium">
                            {tmpl.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={handleReset}
                className="text-indigo-500 hover:text-indigo-700 text-sm font-bold transition-colors flex items-center gap-1 touch-manipulation py-2"
              >
                ← Back to Templates
              </button>

              {/* Form */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg md:text-xl text-gray-800">
                  {template?.label} Challenge
                </h3>

                {template?.blanks.map((blank) => (
                  <div key={blank.key}>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-gray-800 placeholder:text-gray-400 transition-all font-medium text-sm md:text-base touch-manipulation"
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="p-4 md:p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-bold mb-2">
                  Your Statement
                </p>
                <p className="text-gray-800 text-base md:text-lg leading-relaxed font-medium">
                  {generatedStatement}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-bold touch-manipulation"
                >
                  Start Over
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold hover:from-indigo-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/30 touch-manipulation"
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
