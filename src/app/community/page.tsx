import type { Metadata } from "next";
import { CommunityLandingContent } from "./CommunityLandingContent";
import { WebPageSchema, FAQSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Online Autism Parent Community | Support & Q&A | Neuro Kid",
  description: "Join thousands of parents who understand. Ask questions, share experiences, and find support in our judgment-free autism parent community. You're not alone.",
  keywords: [
    "autism parent community",
    "autism support group online",
    "parents of autistic children forum",
    "autism parent network",
    "special needs parent support",
    "autism family support",
    "autism parent questions",
    "neurodivergent parent community",
    "autism parenting advice",
    "autism mom support",
  ],
  openGraph: {
    title: "Online Autism Parent Community | Support & Q&A | Neuro Kid",
    description: "Join thousands of parents who understand. Ask questions, share experiences, and find support in our judgment-free community.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/community",
  },
};

const faqQuestions = [
  {
    question: "Is the Neuro Kid community free to join?",
    answer: "Yes, our autism parent community is completely free. Connect with other parents, ask questions, and share experiences at no cost.",
  },
  {
    question: "Is it safe to share in the community?",
    answer: "Absolutely. We prioritize privacy and safety. You can post anonymously if you prefer, and our moderation team ensures a supportive, judgment-free environment.",
  },
  {
    question: "What topics are discussed in the community?",
    answer: "Parents discuss everything from therapy recommendations and school IEPs to daily challenges and celebrations. No topic is off-limits when it comes to supporting your child.",
  },
  {
    question: "Can I get medical advice in the community?",
    answer: "While parents share personal experiences, we don't allow medical advice. Always consult qualified professionals for medical decisions. Our community is for emotional support and practical tips.",
  },
  {
    question: "How is the community moderated?",
    answer: "We have active moderation to ensure kindness and respect. Hate speech, judgment, and misinformation are not tolerated. Our goal is a safe space for all families.",
  },
];

export default function CommunityPage() {
  return (
    <>
      <WebPageSchema
        title="Online Autism Parent Community | Neuro Kid"
        description="Join thousands of parents who understand. Ask questions, share experiences, and find support."
        url="https://neurokid.help/community"
      />
      <FAQSchema questions={faqQuestions} />
      <CommunityLandingContent />
    </>
  );
}
