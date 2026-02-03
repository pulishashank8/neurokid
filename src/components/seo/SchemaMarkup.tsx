"use client";

import Script from "next/script";

interface SoftwareAppSchemaProps {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  price?: string;
  priceCurrency?: string;
  ratingValue?: number;
  ratingCount?: number;
  url?: string;
}

export function SoftwareAppSchema({
  name = "Neuro Kid",
  description = "AAC and autism support app for children and parents",
  applicationCategory = "HealthApplication",
  operatingSystem = "Web",
  price = "0",
  priceCurrency = "USD",
  ratingValue = 4.8,
  ratingCount = 127,
  url = "https://neurokid.help",
}: SoftwareAppSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toString(),
      ratingCount: ratingCount.toString(),
    },
    url,
    author: {
      "@type": "Organization",
      name: "Neuro Kid",
      url: "https://neurokid.help",
    },
  };

  return (
    <Script
      id="software-app-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export function OrganizationSchema({
  name = "Neuro Kid",
  url = "https://neurokid.help",
  logo = "https://neurokid.help/logo.png",
  description = "AAC and autism support app for children and parents",
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs: [
      "https://facebook.com/neurokid",
      "https://instagram.com/neurokid",
      "https://twitter.com/neurokid",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "English",
    },
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebPageSchemaProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export function WebPageSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
}: WebPageSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
  };

  if (image) {
    schema.image = image;
  }
  if (datePublished) {
    schema.datePublished = datePublished;
  }
  if (dateModified) {
    schema.dateModified = dateModified;
  }

  return (
    <Script
      id="webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = "Neuro Kid",
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Neuro Kid",
      logo: {
        "@type": "ImageObject",
        url: "https://neurokid.help/logo.png",
      },
    },
  };

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface MedicalWebPageSchemaProps {
  title: string;
  description: string;
  url?: string;
  lastReviewed?: string;
}

export function MedicalWebPageSchema({
  title,
  description,
  url,
  lastReviewed,
}: MedicalWebPageSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: title,
    description,
    url,
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
  };

  if (lastReviewed) {
    schema.lastReviewed = lastReviewed;
  }

  return (
    <Script
      id="medical-webpage-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
