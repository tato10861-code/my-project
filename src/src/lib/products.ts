export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const PRODUCTS: Product[] = [
  {
    id: 'propauto-premium-access',
    name: 'PropAuto AI Premium Access',
    description: 'Priority access to verified listings, investor signals, and private concierge support.',
    priceInCents: 4900,
  },
]

export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id)
}
