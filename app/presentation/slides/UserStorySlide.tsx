"use client";

export function UserStorySlide() {
  const steps = [
    { num: "1", text: "Student frames a challenge with a clear HMW prompt" },
    { num: "2", text: "Volition asks Socratic questions to unlock ideas" },
    { num: "3", text: "Student captures, refines, and selects concepts" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-20">
      <span className="text-9xl mb-10">👤</span>
      <h2 className="text-6xl font-black text-gray-800 mb-12">User Story</h2>

      <div className="fragment fade-up space-y-8 max-w-4xl">
        {steps.map((step) => (
          <div key={step.num} className="flex items-start gap-6">
            <span className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-black text-xl flex-shrink-0">
              {step.num}
            </span>
            <p className="text-3xl text-gray-600 font-medium pt-1">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
