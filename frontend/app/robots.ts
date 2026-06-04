import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/_next/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "https://wrt.app"}/sitemap.xml`,
  };
}