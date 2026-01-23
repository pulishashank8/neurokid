"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type QA = { id: number; text: string };

// Official M-CHAT-R/F Questions for Toddlers (16-30 months)
// © 2009 Diana Robins, Deborah Fein, & Marianne Barton
// Free for clinical, research, and educational purposes
// Download from: www.mchatscreen.com
const TODDLER_QUESTIONS: QA[] = [
  { id: 1, text: "If you point at something across the room, does your child look at it? (For example, if you point at a toy or an animal, does your child look at the toy or animal?)" },
  { id: 2, text: "Have you ever wondered if your child might be deaf?" },
  { id: 3, text: "Does your child play pretend or make-believe? (For example, pretend to drink from an empty cup, pretend to talk on a phone, or pretend to feed a doll or stuffed animal?)" },
  { id: 4, text: "Does your child like climbing on things? (For example, furniture, playground equipment, or stairs)" },
  { id: 5, text: "Does your child make unusual finger movements near his or her eyes? (For example, does your child wiggle his or her fingers close to his or her eyes?)" },
  { id: 6, text: "Does your child point with one finger to ask for something or to get help? (For example, pointing to a snack or toy that is out of reach)" },
  { id: 7, text: "Does your child point with one finger to show you something interesting? (For example, pointing to an airplane in the sky or a big truck in the road)" },
  { id: 8, text: "Is your child interested in other children? (For example, does your child watch other children, smile at them, or go to them?)" },
  { id: 9, text: "Does your child show you things by bringing them to you or holding them up for you to see – not to get help, but just to share? (For example, showing you a flower, a stuffed animal, or a toy truck)" },
  { id: 10, text: "Does your child respond when you call his or her name? (For example, does he or she look up, talk or babble, or stop what he or she is doing when you call his or her name?)" },
  { id: 11, text: "When you smile at your child, does he or she smile back at you?" },
  { id: 12, text: "Does your child get upset by everyday noises? (For example, does your child scream or cry to noise such as a vacuum cleaner or loud music?)" },
  { id: 13, text: "Does your child walk?" },
  { id: 14, text: "Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?" },
  { id: 15, text: "Does your child try to copy what you do? (For example, wave bye-bye, clap, or make a funny noise when you do)" },
  { id: 16, text: "If you turn your head to look at something, does your child look around to see what you are looking at?" },
  { id: 17, text: "Does your child try to get you to watch him or her? (For example, does your child look at you for praise, or say \"look\" or \"watch me\"?)" },
  { id: 18, text: "Does your child understand when you tell him or her to do something? (For example, if you don't point, can your child understand \"put the book on the chair\" or \"bring me the blanket\"?)" },
  { id: 19, text: "If something new happens, does your child look at your face to see how you feel about it? (For example, if he or she hears a strange or funny noise, or sees a new toy, will he or she look at your face?)" },
  { id: 20, text: "Does your child like movement activities? (For example, being swung or bounced on your knee)" },
];

const CHILD_QUESTIONS: QA[] = [
  { id: 1, text: "Does your child struggle to make or keep friends?" },
  { id: 2, text: "Does your child have difficulty starting conversations with peers?" },
  { id: 3, text: "Does your child avoid eye contact or use it inconsistently?" },
  { id: 4, text: "Does your child struggle to understand others' feelings or perspectives?" },
  { id: 5, text: "Does your child miss social cues (tone of voice, facial expression, body language)?" },
  { id: 6, text: "Does your child have difficulty with back-and-forth conversation?" },
  { id: 7, text: "Does your child speak in an unusual way (very formal, monotone, scripted)?" },
  { id: 8, text: "Does your child repeat words/phrases or ask the same questions repeatedly?" },
  { id: 9, text: "Does your child talk mostly about one preferred topic and resist changing topics?" },
  { id: 10, text: "Does your child prefer being alone rather than playing with peers?" },
  { id: 11, text: "Does your child become highly upset by routine changes or transitions?" },
  { id: 12, text: "Does your child have sensory sensitivities (noise, clothes tags, textures, bright lights)?" },
  { id: 13, text: "Does your child have repetitive movements (rocking, hand flapping, pacing)?" },
  { id: 14, text: "Does your child play in repetitive ways (same exact scenario repeatedly)?" },
  { id: 15, text: "Does your child have unusually intense interests compared to peers?" },
  { id: 16, text: "Does your child insist things be done in a specific way (rigid thinking)?" },
  { id: 17, text: "Does your child have big emotional outbursts that seem bigger than the situation?" },
  { id: 18, text: "Does your child struggle with group activities/team games?" },
  { id: 19, text: "Does your child struggle with personal space/social boundaries?" },
  { id: 20, text: "Have teachers/caregivers expressed concerns about social communication/behavior?" },
];

export default function ScreeningFlowPage() {
  const router = useRouter();
  const params = useParams();
  const groupParam = params?.group;
  const group = (Array.isArray(groupParam) ? groupParam[0] : groupParam) as "toddler" | "child" || "child";

  const questions = useMemo(() => (group === "toddler" ? TODDLER_QUESTIONS : CHILD_QUESTIONS), [group]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<("yes" | "no" | null)[]>(Array(20).fill(null));

  useEffect(() => {
    const intake = sessionStorage.getItem("nk-screening-intake");
    if (!intake) {
      // Go back to intro if no intake captured
      router.replace("/screening");
    }
  }, [router]);

  const setAnswer = (value: "yes" | "no") => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (index < 19) {
        setIndex((i) => Math.min(19, i + 1));
      }
    }, 600);
  };

  // Check if all questions have been answered
  const allAnswered = answers.every((a) => a !== null);

  const handleNext = () => {
    if (answers[index] === null) {
      alert("Please answer this question (Yes or No) before moving to the next one.");
      return;
    }
    setIndex((i) => Math.min(19, i + 1));
  };

  const computeScore = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log("Computing score... Current state:", { group, allAnswered, answers });

    if (!allAnswered) {
      const missing = answers
        .map((a, i) => (a === null ? i + 1 : null))
        .filter((i) => i !== null);

      alert(`Please answer all 20 questions before viewing results. Missing questions: ${missing.join(", ")}`);
      return;
    }

    try {
      if (group === "toddler") {
        // ... (existing toddler logic) ...
        let score = 0;
        const reverseScored = [1, 4, 11]; // indices for questions 2, 5, 12 (0-indexed)

        answers.forEach((answer, i) => {
          if (answer === null) return;
          if (reverseScored.includes(i)) {
            if (answer === "yes") score++;
          } else {
            if (answer === "no") score++;
          }
        });

        let category: "Low" | "Moderate" | "High" = "Low";
        if (score >= 8) category = "High";
        else if (score >= 3) category = "Moderate";

        const summary = {
          score,
          category,
          group,
          rawScore: score,
          maxScore: 20,
          createdAt: new Date().toISOString(),
          interpretation: score <= 2
            ? "Low risk. Continue monitoring development. Re-screen at future well-child visits."
            : score <= 7
              ? "Moderate risk. Follow-up screening recommended. Discuss results with your pediatrician."
              : "High risk. Immediate referral for diagnostic evaluation and early intervention services is recommended.",
        };

        sessionStorage.setItem("nk-screening-summary", JSON.stringify(summary));
        console.log("Summary saved, navigating...", summary);

        setTimeout(() => {
          window.location.href = "/screening/result";
        }, 1500);
        router.push("/screening/result");
      } else {
        // Child screening (3-12 years)
        let score = 0;
        answers.forEach((answer) => {
          if (answer === "yes") score++;
        });

        const percentage = Math.round((score / 20) * 100);
        let category: "Low" | "Moderate" | "High" = "Low";
        if (percentage >= 50) category = "High";
        else if (percentage >= 25) category = "Moderate";

        const summary = {
          score: percentage,
          category,
          group,
          rawScore: score,
          maxScore: 20,
          createdAt: new Date().toISOString(),
          interpretation: percentage < 25
            ? "Low concern level. Continue monitoring and discuss at routine check-ups."
            : percentage < 50
              ? "Moderate concern level. Consider consultation with healthcare provider or developmental specialist."
              : "Higher concern level. Professional evaluation by a developmental specialist is recommended.",
        };

        sessionStorage.setItem("nk-screening-summary", JSON.stringify(summary));
        console.log("Summary saved, navigating...", summary);

        setTimeout(() => {
          window.location.href = "/screening/result";
        }, 1500);
        router.push("/screening/result");
      }
    } catch (err) {
      console.error("Error computing score:", err);
      alert("There was an error calculating your results. Please try again or contact support.");
    }
  };

  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--text)] leading-tight">
            Screening — {group === "toddler" ? "Toddler" : "Child"}
          </h1>
          <span className="text-xs sm:text-sm font-bold text-[var(--muted)] whitespace-nowrap bg-[var(--surface2)] px-2 py-1 rounded-md border border-[var(--border)]">
            {index + 1} of 20
          </span>
        </div>

        {/* Progress */}
        <div className="mb-8 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface2)] border border-[var(--border)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <p className="text-lg sm:text-xl font-bold text-[var(--text)] leading-relaxed">
            {questions[index].text}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setAnswer("yes")}
              type="button"
              className={`flex-1 rounded-2xl px-6 py-4 text-base font-black border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${answers[index] === "yes"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[index] === "yes" ? "border-white" : "border-[var(--border)]"}`}>
                {answers[index] === "yes" && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
              </div>
              Yes
            </button>
            <button
              onClick={() => setAnswer("no")}
              type="button"
              className={`flex-1 rounded-2xl px-6 py-4 text-base font-black border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${answers[index] === "no"
                ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[index] === "no" ? "border-white" : "border-[var(--border)]"}`}>
                {answers[index] === "no" && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
              </div>
              No
            </button>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-4 py-2 text-sm hover:bg-[var(--surface2)] transition-colors min-h-[44px]"
            >
              Back
            </button>
            {index < 19 ? (
              <button
                onClick={handleNext}
                type="button"
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all min-h-[44px]"
              >
                Next
              </button>
            ) : (
              <button
                onClick={computeScore}
                type="button"
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] transition-all min-h-[44px] shadow-lg shadow-[var(--primary)]/20"
              >
                See Results
              </button>
            )}
          </div>

          <p className="mt-6 text-xs text-[var(--muted)]">
            Disclaimer: This screening does not diagnose autism. It only indicates whether a professional evaluation may be helpful.
          </p>
        </div>
      </div>
    </div>
  );
}
