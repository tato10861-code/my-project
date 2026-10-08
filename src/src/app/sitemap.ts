import type { MetadataRoute } from 'next'

const siteUrl = 'https://propauto-ai-al-closer-saas.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/investors`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
