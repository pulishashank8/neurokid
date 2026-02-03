import type { Metadata } from "next";
import { TherapyLogLandingContent } from "./TherapyLogLandingContent";
import { SoftwareAppSchema, FAQSchema, WebPageSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Autism Therapy Log & Progress Tracker | ABA, OT, Speech | Neuro Kid",
  description: "Track ABA, speech, and occupational therapy in one place. Monitor your child's progress, spot patterns, and share reports with your therapy team. Free therapy tracker app.",
  keywords: [
    "autism therapy tracker",
    "ABA therapy log",
    "autism progress tracking",
    "therapy session log",
    "occupational therapy tracker",
    "speech therapy log",
    "autism therapy app",
    "behavior tracking app",
    "therapy notes app",
    "special needs therapy tracker",
  ],
  openGraph: {
    title: "Autism Therapy Log & Progress Tracker | Neuro Kid",
    description: "Track ABA, speech, and occupational therapy in one place. Monitor progress and share with your therapy team.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/therapy-log",
  },
};

const faqQuestions = [
  {
    question: "How do I track my child's autism therapy progress?",
    answer: "Use Neuro Kid's therapy log to record session details, track goals, note behaviors, and monitor mood over time. Visual charts help you see progress patterns and share insights with therapists.",
  },
  {
    question: "Can I track multiple therapy types?",
    answer: "Yes! Neuro Kid supports ABA therapy, speech therapy, occupational therapy, behavioral therapy, play therapy, social skills, and physical therapy—all in one organized dashboard.",
  },
  {
    question: "Is my therapy data private and secure?",
    answer: "Absolutely. All therapy logs are encrypted and stored securely. You control who has access, and we never sell or share your child's data with third parties.",
  },
  {
    question: "Can I share therapy logs with my child's team?",
    answer: "Yes, you can generate shareable reports to send to therapists, doctors, and teachers. This keeps everyone on the same page about your child's progress.",
  },
  {
    question: "Is the therapy tracker free?",
    answer: "Yes, Neuro Kid's therapy tracking features are completely free. Log unlimited sessions and access basic progress charts at no cost.",
  },
];

export default function TherapyLogPage() {
  return (
    <>
      <SoftwareAppSchema
        name="Neuro Kid Therapy Log"
        description="Autism therapy tracking app for ABA, OT, speech and more"
        applicationCategory="HealthApplication"
        price="0"
      />
      <WebPageSchema
        title="Autism Therapy Log & Progress Tracker | Neuro Kid"
        description="Track ABA, speech, and occupational therapy in one place."
        url="https://neurokid.help/therapy-log"
      />
      <FAQSchema questions={faqQuestions} />
      <TherapyLogLandingContent />
    </>
  );
}
