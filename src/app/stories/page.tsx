import type { Metadata } from "next";
import { StoriesPageContent } from "./StoriesPageContent";
import { SoftwareAppSchema, FAQSchema, WebPageSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "AI Social Stories for Autistic Kids | Personalized & Free | Neuro Kid",
  description: "Create personalized social stories in seconds. Help your child understand new situations, routines, and social skills with AI-generated stories tailored to their needs.",
  keywords: [
    "social stories app for autism",
    "AI social stories",
    "autism social stories generator",
    "personalized social stories",
    "social stories for autistic children",
    "social narrative app",
    "autism story maker",
    "social skills stories",
    "autism transition stories",
    "visual stories autism",
  ],
  openGraph: {
    title: "AI Social Stories for Autistic Kids | Neuro Kid",
    description: "Create personalized social stories in seconds. Help your child understand new situations and social skills.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/stories",
  },
};

const faqQuestions = [
  {
    question: "What are social stories for autism?",
    answer: "Social stories are short, personalized narratives that help autistic children understand social situations, expectations, and routines. They describe what will happen, why, and how the child should respond.",
  },
  {
    question: "How does the AI generate social stories?",
    answer: "Simply tell us the situation (like 'first dentist visit' or 'starting school'), and our AI creates a personalized story with your child's name, appropriate language, and visual-friendly structure.",
  },
  {
    question: "Are the social stories free?",
    answer: "Yes! You can generate a limited number of AI social stories for free each month. Premium subscribers get unlimited story generation and additional customization options.",
  },
  {
    question: "Can I print the stories?",
    answer: "Absolutely! All generated stories can be printed as PDFs, saved to your device, or read aloud from the app. Use them however works best for your child.",
  },
  {
    question: "What topics work best for social stories?",
    answer: "Popular topics include doctor visits, haircuts, new siblings, starting school, playdates, bedtime routines, handling changes, and understanding emotions.",
  },
];

export default function StoriesPage() {
  return (
    <>
      <SoftwareAppSchema
        name="Neuro Kid AI Stories"
        description="AI-powered social stories generator for autistic children"
        applicationCategory="HealthApplication"
        price="0"
      />
      <WebPageSchema
        title="AI Social Stories for Autistic Kids | Neuro Kid"
        description="Create personalized social stories in seconds. Help your child understand new situations and social skills."
        url="https://neurokid.help/stories"
      />
      <FAQSchema questions={faqQuestions} />
      <StoriesPageContent />
    </>
  );
}
