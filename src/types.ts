import type { Product } from '@shopify/shopify-api/rest/admin/2024-04/product'
import type { Metafield } from '@shopify/shopify-api/rest/admin/2024-04/metafield'

export interface ProductWithMeta {
  product: Product
  meta: Metafield[]
}

export interface ProductCustomizerValue {
  position?: string
  type: string
  options?: string
  option_prices?: string
  description?: string
  placeholder?: string
  required?: string
  label?: string
  fonts?: string
  option_id?: string
  price?: string
  product_option_id: string
  name: string
}

export interface CartItemProps {
  [key: string]: string
}

export interface PriceAndName {
  price: number
  name: string
}
