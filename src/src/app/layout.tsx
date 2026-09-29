import { Analytics } from '@vercel/analytics/next'
import { Geist, Noto_Sans_Arabic } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { PropAutoVoiceConcierge } from '@/components/propauto-voice-concierge'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const arabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-arabic' })
import './globals.css'

// metadata improved for SEO and social previews
export const metadata: Metadata = {
  title: 'PropAuto | Luxury Properties & Cars AI Platform',
  description: 'Discover verified luxury real estate, rare cars, and investment opportunities with PropAuto AI.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://propauto.example'),
  alternates: {
    canonical: '/',
    languages: { en: '/', ar: '/?lang=ar' },
  },
  openGraph: {
    title: 'PropAuto | Luxury Properties & Cars AI Platform',
    description: 'Discover verified luxury real estate, rare cars, and investment opportunities with PropAuto AI.',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://propauto.example',
    siteName: 'PropAuto AI',
    type: 'website',
  },
  generator: 'PropAuto AI',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? undefined,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${geist.variable} ${arabic.variable} bg-[#071014]`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <PropAutoVoiceConcierge />
      </body>
    </html>
  )
}
