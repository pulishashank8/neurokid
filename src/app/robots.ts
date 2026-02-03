import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://neurokid.help";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/owner/",
          "/admin/",
          "/settings",
          "/messages",
          "/bookmarks",
          "/moderation",
          "/therapy-log",
          "/daily-wins",
          "/emergency-card",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
          "/login",
          "/register",
          "/onboarding",
          "/dashboard",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/owner/",
          "/admin/",
          "/settings",
          "/messages",
          "/bookmarks",
          "/moderation",
          "/therapy-log",
          "/daily-wins",
          "/emergency-card",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
