import { ImageResponse } from 'next/og'

export const alt = 'PropAuto AI — luxury real estate and rare cars'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Share card rendered at build time as a PNG (social networks do not render SVG). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#071014', color: '#f5f1e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, border: '2px solid #d5b77b', color: '#d5b77b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>P</div>
          <div style={{ display: 'flex', fontSize: 36 }}>PropAuto <span style={{ color: '#d5b77b', marginLeft: 10 }}>AI</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 72, lineHeight: 1.05, maxWidth: 960 }}>Luxury real estate and rare cars, with the intelligence to own them well.</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#b4c1bf' }}>Verified listings · Investor tools · Multilingual concierge</div>
        </div>
      </div>
    ),
    size,
  )
}
