import type { MetadataRoute } from 'next'

const siteUrl = 'https://propauto-ai-al-closer-saas.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
