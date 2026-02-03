import type { Metadata } from "next";
import { BlogLandingContent } from "./BlogLandingContent";
import { WebPageSchema } from "@/components/seo/SchemaMarkup";

export const metadata: Metadata = {
  title: "Autism Resources & Parenting Guides | Neuro Kid Blog",
  description: "Expert articles and guides for parents of autistic children. Learn about AAC, therapy tracking, communication strategies, and find support for your autism parenting journey.",
  keywords: [
    "autism parenting blog",
    "autism resources for parents",
    "AAC communication guide",
    "autism therapy tips",
    "autism parenting advice",
    "special needs parenting",
    "autism communication strategies",
    "autism support resources",
  ],
  openGraph: {
    title: "Autism Resources & Parenting Guides | Neuro Kid Blog",
    description: "Expert articles and guides for parents of autistic children.",
    type: "website",
  },
  alternates: {
    canonical: "https://neurokid.help/blog",
  },
};

export default function BlogPage() {
  return (
    <>
      <WebPageSchema
        title="Autism Resources & Parenting Guides | Neuro Kid Blog"
        description="Expert articles and guides for parents of autistic children."
        url="https://neurokid.help/blog"
      />
      <BlogLandingContent />
    </>
  );
}
