import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://landvest-my-production.up.railway.app",
      lastModified: new Date(),
    },
  ];
}
