import type { Metadata } from "next";
import { AACLandingContent } from "./AACLandingContent";
import { SoftwareAppSchema, FAQSchema, WebPageSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "AAC App for Autistic Children | Picture Boards & Speech | Neuro Kid",
  description: "Help your nonverbal or minimally verbal child communicate with Neuro Kid's AAC app. Customizable picture boards, text-to-speech, and autism-friendly design. Free to start.",
  keywords: [
    "AAC app for autism",
    "autism communication app",
    "AAC for nonverbal child",
    "picture exchange app",
    "autism speech therapy apps",
    "visual communication board",
    "text to speech autism",
    "nonverbal autism communication",
    "AAC device alternative",
    "autism communication tools",
  ],
  openGraph: {
    title: "AAC App for Autistic Children | Picture Boards & Speech | Neuro Kid",
    description: "Help your nonverbal or minimally verbal child communicate with Neuro Kid's AAC app. Customizable picture boards, text-to-speech, and autism-friendly design.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/aac",
  },
};

const faqQuestions = [
  {
    question: "What is an AAC app for autism?",
    answer: "An AAC (Augmentative and Alternative Communication) app helps nonverbal or minimally verbal autistic children express themselves. It uses picture boards, symbols, and text-to-speech technology to give children a voice when verbal communication is challenging.",
  },
  {
    question: "Is Neuro Kid's AAC app free?",
    answer: "Yes, Neuro Kid's basic AAC features are free to use. Premium features like advanced customization and additional symbol libraries are available with a subscription.",
  },
  {
    question: "Can I use this AAC app on any device?",
    answer: "Absolutely! Neuro Kid's AAC app works on any device with a web browser—tablets, phones, and computers. It's designed to be accessible wherever your child needs to communicate.",
  },
  {
    question: "How do I get started with AAC for my autistic child?",
    answer: "Start by introducing a few familiar symbols or pictures. Use the app consistently during daily routines. Neuro Kid includes guided onboarding and suggested starting boards to make the process easier for parents.",
  },
  {
    question: "Is this AAC app suitable for nonverbal children?",
    answer: "Yes, Neuro Kid's AAC app is specifically designed for nonverbal and minimally verbal autistic children. The interface is sensory-friendly with large, clear buttons and customizable layouts.",
  },
];

export default function AACPage() {
  return (
    <>
      <SoftwareAppSchema
        name="Neuro Kid AAC"
        description="AAC app for autistic children with picture boards and text-to-speech"
        applicationCategory="HealthApplication"
        price="0"
      />
      <WebPageSchema
        title="AAC App for Autistic Children | Neuro Kid"
        description="Help your nonverbal or minimally verbal child communicate with Neuro Kid's AAC app."
        url="https://neurokid.help/aac"
      />
      <FAQSchema questions={faqQuestions} />
      <AACLandingContent />
    </>
  );
}
