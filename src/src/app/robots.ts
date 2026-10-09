import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/sign-in', '/sign-up'] }],
    sitemap: 'https://propauto-ai-al-closer-saas.vercel.app/sitemap.xml',
  }
}
