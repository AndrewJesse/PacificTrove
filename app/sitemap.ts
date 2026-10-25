import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pacifictrove.com";
  return [
    {
      changeFrequency: "weekly",
      priority: 1,
      url: base,
    },
    {
      changeFrequency: "monthly",
      priority: 0.7,
      url: `${base}/subscribe`,
    },
    {
      changeFrequency: "yearly",
      priority: 0.3,
      url: `${base}/login`,
    },
    {
      changeFrequency: "yearly",
      priority: 0.3,
      url: `${base}/register`,
    },
  ];
}
