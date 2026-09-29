import type { MetadataRoute } from 'next'

const siteUrl = 'https://propauto-ai-al-closer-saas.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/investors', '/contact', '/privacy', '/terms']
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
