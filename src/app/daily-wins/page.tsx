import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DailyWinsLandingContent } from "./DailyWinsLandingContent";
import { DailyWinsApp } from "./DailyWinsApp";
import { SoftwareAppSchema, FAQSchema, WebPageSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Visual Schedule & Daily Routine App for Autism | Neuro Kid",
  description: "Reduce anxiety and transitions with customizable visual schedules. Create daily routines that help your autistic child feel secure and in control. Free visual schedule app.",
  keywords: [
    "visual schedule app autism",
    "autism daily routine tracker",
    "visual schedule for autistic child",
    "autism routine app",
    "daily schedule autism",
    "visual timer autism",
    "autism transition support",
    "picture schedule app",
    "autism schedule printable alternative",
    "special needs routine app",
  ],
  openGraph: {
    title: "Visual Schedule & Daily Routine App for Autism | Neuro Kid",
    description: "Reduce anxiety and transitions with customizable visual schedules. Create daily routines that help your autistic child feel secure.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/daily-wins",
  },
};

const faqQuestions = [
  {
    question: "Why do visual schedules help autistic children?",
    answer: "Visual schedules reduce anxiety by making the day's structure predictable. They help autistic children understand what comes next, ease transitions between activities, and provide a sense of control and security.",
  },
  {
    question: "Can I customize the visual schedule?",
    answer: "Absolutely! You can add your own photos, adjust timing, create different schedules for weekdays vs weekends, and customize the layout to match your child's preferences and needs.",
  },
  {
    question: "Does the app include timers?",
    answer: "Yes, visual timers are included to help children understand how long each activity lasts. This is especially helpful for transitions and time-limited activities.",
  },
  {
    question: "Is the visual schedule app free?",
    answer: "Yes, Neuro Kid's basic visual scheduling features are completely free. Premium features like unlimited schedules and advanced customization are available with a subscription.",
  },
  {
    question: "Can I use this for school routines?",
    answer: "Yes! Many parents create school-specific schedules including morning routines, after-school activities, and homework time. You can even share schedules with teachers.",
  },
];

export default async function DailyWinsPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    return <DailyWinsApp />;
  }

  return (
    <>
      <SoftwareAppSchema
        name="Neuro Kid Visual Schedule"
        description="Visual schedule and daily routine app for autistic children"
        applicationCategory="HealthApplication"
        price="0"
      />
      <WebPageSchema
        title="Visual Schedule & Daily Routine App for Autism | Neuro Kid"
        description="Reduce anxiety and transitions with customizable visual schedules."
        url="https://neurokid.help/daily-wins"
      />
      <FAQSchema questions={faqQuestions} />
      <DailyWinsLandingContent />
    </>
  );
}
