/**
 * Product catalog for the checkout flow. Prices are stored as integer cents to
 * avoid floating-point rounding at Stripe boundaries.
 */
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

/**
 * Looks up a product by its stable identifier.
 *
 * @param id - The product id to find.
 * @returns The matching {@link Product} or undefined when unknown.
 * @complexity O(n) time over the static catalog (n = 1 in production), O(1)
 *   space.
 */
export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id)
}
