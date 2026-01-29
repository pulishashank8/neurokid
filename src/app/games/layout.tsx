import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Learning Games",
  description: "Explore fun, educational games designed for neurodivergent children. Interactive activities for cognitive development, sensory processing, and emotional learning.",
  keywords: [
    "autism games",
    "neurodivergent games",
    "educational games for autism",
    "sensory games",
    "cognitive development games",
    "emotion recognition games",
    "memory games for kids",
  ],
  openGraph: {
    title: "Interactive Learning Games | NeuroKid",
    description: "Explore fun, educational games designed for neurodivergent children. Interactive activities for cognitive development and emotional learning.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Learning Games | NeuroKid",
    description: "Fun educational games designed for neurodivergent children.",
  },
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
