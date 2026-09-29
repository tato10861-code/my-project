import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    source: 'demo',
    updatedAt: new Date().toISOString(),
    disclaimer: 'Indicative demonstration data. Connect a verified market data provider before publishing as live pricing.',
    markets: [
      { city: 'Dubai', property: 8.4, supercar: 6.8, currency: 'USD', signal: 'up' },
      { city: 'Riyadh', property: 6.9, supercar: 4.9, currency: 'USD', signal: 'up' },
      { city: 'London', property: 3.2, supercar: 2.6, currency: 'USD', signal: 'steady' },
      { city: 'Monaco', property: 5.8, supercar: 7.1, currency: 'USD', signal: 'up' },
    ],
  })
}
