import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Volition Presentation",
  description:
    "AI-Powered Design Thinking Through Socratic Questioning - Presentation",
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="presentation-wrapper">{children}</div>;
}
