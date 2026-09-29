// handles enterprise-grade types for the PropAuto AI project

export interface Lead {
  id?: number
  name: string
  email: string
  phone?: string
  intent: 'buyer' | 'investor' | 'seller'
  message?: string
  budget?: string
  language?: string
  createdAt?: string
}

export interface EventRecord {
  id?: number
  sessionId: string
  eventName: string
  path: string
  metadata?: Record<string, unknown>
  createdAt?: string
}

export interface Listing {
  id?: string
  image: string
  type: string
  name: string
  place: string
  price?: string
}

export interface AnalyticsVisit {
  path: string
  count: number
}
