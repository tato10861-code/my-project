import { useMemo } from 'react'
import type { Listing } from '@/types'

const STATIC_LISTINGS: Listing[] = [
  {
    id: 'l-1',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    type: 'REAL ESTATE',
    name: 'Skyline Villa 07',
    place: 'Palm Jumeirah, Dubai',
    price: '$10.5M',
  },
  {
    id: 'l-2',
    image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=85',
    type: 'REAL ESTATE',
    name: 'The Mayfair Residence',
    place: 'London, United Kingdom',
    price: '£8.2M',
  },
  {
    id: 'l-3',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=85',
    type: 'AUTOMOTIVE',
    name: 'Ferrari 812 GTS',
    place: '2024 · 1,200 miles',
    price: '$620K',
  },
]

export function useCars(): Listing[] {
  // returns a stable reference to the static listings — simple, human-friendly hook
  return useMemo(() => STATIC_LISTINGS, [])
}
