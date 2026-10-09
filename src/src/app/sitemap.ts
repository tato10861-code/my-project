import type { MetadataRoute } from 'next'

const siteUrl = 'https://propauto-ai-al-closer-saas.vercel.app'

/** Date of the last content change to the public pages. */
const lastModified = new Date('2026-10-08')

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, changeFrequency: 'weekly' | 'monthly' | 'yearly', priority: number) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: { en: `${siteUrl}${path}`, ar: `${siteUrl}${path}?lang=ar` } },
  })
  return [
    page('/', 'weekly', 1),
    page('/investors', 'monthly', 0.8),
    page('/contact', 'monthly', 0.7),
    page('/privacy', 'yearly', 0.3),
    page('/terms', 'yearly', 0.3),
  ]
}
