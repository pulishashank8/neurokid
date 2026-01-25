"use client";

import { Phone, ExternalLink, Heart, Shield, MessageCircle, Users, MapPin, Clock } from "lucide-react";
import Link from "next/link";

const CRISIS_RESOURCES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support 24/7 for anyone in crisis",
    phone: "988",
    website: "https://988lifeline.org",
    icon: Phone,
    color: "red",
    priority: true,
  },
  {
    name: "Crisis Text Line",
    description: "Text HOME to 741741 for free crisis counseling",
    phone: "741741",
    phoneLabel: "Text HOME to",
    website: "https://crisistextline.org",
    icon: MessageCircle,
    color: "blue",
    priority: true,
  },
  {
    name: "Autism Society Helpline",
    description: "Support and resources for autism families",
    phone: "1-800-328-8476",
    website: "https://autismsociety.org",
    icon: Heart,
    color: "emerald",
    priority: false,
  },
  {
    name: "SAMHSA National Helpline",
    description: "Treatment referral service for mental health and substance use",
    phone: "1-800-662-4357",
    website: "https://samhsa.gov",
    icon: Shield,
    color: "purple",
    priority: false,
  },
  {
    name: "National Parent Helpline",
    description: "Emotional support and resources for parents",
    phone: "1-855-427-2736",
    website: "https://nationalparenthelpline.org",
    icon: Users,
    color: "amber",
    priority: false,
  },
];

const TIPS = [
  {
    title: "During a Meltdown",
    tips: [
      "Stay calm - your child mirrors your energy",
      "Reduce sensory input (lights, sounds)",
      "Provide a safe, quiet space",
      "Don't force eye contact or touch",
      "Use minimal words",
      "Wait it out - don't rush recovery",
    ],
  },
  {
    title: "After a Meltdown",
    tips: [
      "Offer water and a comfort item",
      "Give time to fully recover",
      "Don't lecture or discuss immediately",
      "Note triggers for future reference",
      "Take care of yourself too",
      "Consider what can be prevented next time",
    ],
  },
];

export default function CrisisPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="relative overflow-hidden bg-gradient-to-b from-red-500/5 via-[var(--surface)] to-[var(--background)] border-b border-[var(--border)] pt-8 pb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold mb-4">
            <Phone className="w-4 h-4" />
            Crisis Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">
            You Are Not Alone
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-6">
            If you or someone you know is in crisis, help is available right now. These resources are free and confidential.
          </p>
          
          <Link 
            href="/calm"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:-translate-y-0.5 transition-all border-2 border-emerald-700 min-h-[48px]"
          >
            <Heart className="w-5 h-5" />
            <span>Need to Calm Down First?</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-10">
        <div className="space-y-4 mb-12">
          {CRISIS_RESOURCES.map((resource) => {
            const Icon = resource.icon;
            const colorClasses = {
              red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
              blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
              emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
              purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
              amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
            };
            const iconBg = {
              red: "bg-red-500",
              blue: "bg-blue-500",
              emerald: "bg-emerald-500",
              purple: "bg-purple-500",
              amber: "bg-amber-500",
            };

            return (
              <div
                key={resource.name}
                className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                  resource.priority 
                    ? colorClasses[resource.color as keyof typeof colorClasses]
                    : "bg-[var(--surface)] border-[var(--border)]"
                }`}
              >
                {resource.priority && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    PRIORITY
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className={`w-14 h-14 rounded-xl ${iconBg[resource.color as keyof typeof iconBg]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[var(--text)] mb-1">{resource.name}</h2>
                    <p className="text-[var(--muted)] mb-4">{resource.description}</p>
                    
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`tel:${resource.phone.replace(/-/g, "")}`}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all min-h-[44px] ${
                          resource.color === "red" ? "bg-red-600 text-white border-2 border-red-700" :
                          resource.color === "blue" ? "bg-blue-600 text-white border-2 border-blue-700" :
                          resource.color === "emerald" ? "bg-emerald-600 text-white border-2 border-emerald-700" :
                          resource.color === "purple" ? "bg-purple-600 text-white border-2 border-purple-700" :
                          "bg-amber-600 text-white border-2 border-amber-700"
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                        <span className="font-bold">{resource.phoneLabel ? `${resource.phoneLabel} ${resource.phone}` : `Call ${resource.phone}`}</span>
                      </a>
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-600 font-semibold border-2 border-emerald-500 hover:bg-emerald-50 transition-all min-h-[44px]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="font-bold">Website</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {TIPS.map((section) => (
            <div key={section.title} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-premium">
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--primary)]" />
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[var(--muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-premium">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">Find Local Resources</h3>
              <p className="text-[var(--muted)] mb-4">
                Every state has local crisis services, autism support groups, and family resources. 
                Contact your local Autism Society chapter or search for "autism family support" in your area.
              </p>
              <a
                href="https://autismsociety.org/local-chapters/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--primary)] font-medium hover:underline"
              >
                Find Your Local Autism Society Chapter
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            Remember: It's okay to ask for help. Taking care of yourself helps you take care of your child.
          </p>
        </div>
      </div>
    </div>
  );
}
