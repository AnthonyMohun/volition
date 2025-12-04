import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Volition Presentation",
  description:
    "Socratic AI for clearer, faster idea development - Presentation",
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="presentation-wrapper">{children}</div>;
}
