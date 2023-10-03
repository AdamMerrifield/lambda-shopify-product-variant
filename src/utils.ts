import type { Product } from '@shopify/shopify-api/rest/admin/2023-07/product'
import type { Metafield } from '@shopify/shopify-api/rest/admin/2023-07/metafield'
import type { Variant } from '@shopify/shopify-api/rest/admin/2023-07/variant'
import type { CartItemProps, PriceAndName, ProductCustomizerValue } from 'src/types'

// get pricing from properties and metafields passed in
export function calcPriceAndName(product: Product, meta: Metafield[], quantity: number, properties: CartItemProps): PriceAndName {
  const defaultVariant = getVariantByName(product, 'Default Title')
  const price = defaultVariant ? Number.parseFloat(defaultVariant.price ?? '0.0') : 0.0
  const names: { key: string; val: string; price?: number }[] = []
  let quantityDiscountPercent = 0
  let additionalOptionsCents = 0

  if (price === 0.0)
    console.error(`Invalid base variant for productid ${product.id}`)

  meta.forEach((metaField) => {
    const namespace = metaField.namespace?.trim()
    // setup quantity discounts
    if (namespace === 'discount' && metaField.key?.trim() === 'key' && typeof metaField.value === 'string') {
      const quantityDiscounts = metaField.value.split(',')
      let quantityDiscountName = null
      // go through each discount
      quantityDiscounts.forEach((discounts: string) => {
        const v = discounts.split(':').map(val => Number.parseInt(val, 10))
        // if the quantity passed in is greater and the discount is greater, use this discount
        if (v[0] <= quantity && v[1] >= quantityDiscountPercent) {
          quantityDiscountName = v[0].toString()
          quantityDiscountPercent = v[1]
        }
      })

      if (quantityDiscountName !== null)
        names.push({ key: '__discount', val: quantityDiscountName, price: quantityDiscountPercent })
    }
    else if (namespace === 'product_customizer' && typeof metaField.value === 'string') {
      // all product customizer fields are json
      const val: ProductCustomizerValue = JSON.parse(metaField.value)
      // if the name of this field is in properties check it's value for a pricing
      if (val.name && val.name in properties && val.options && val.option_prices) {
        const property = properties[val.name]
        const options = val.options.split(',')
        const prices = val.option_prices.split(',')
        const index = options.indexOf(property)
        let optionPrice = 0.0
        // find the pricing for this option
        if (index in prices) {
          optionPrice = Number.parseInt(prices[index], 10)
          // only add to the name if the option has a price greater than 0
          if (optionPrice > 0.0)
            names.push({ key: val.name, val: options[index], price: optionPrice })
        }
        else {
          optionPrice = Number.parseInt(prices.pop() ?? '0', 10)
          // only add to the name if the option has a price greater than 0
          if (optionPrice > 0.0)
            names.push({ key: val.name, val: options.pop() ?? '', price: optionPrice })
        }
        // add the options price to total pricing
        if (optionPrice > 0.0)
          additionalOptionsCents += optionPrice
      }
    }
  })
  // make sure the keys are always sorted the same way so the name is consistant
  names.sort((a, b) => {
    if (a.key < b.key)
      return -1
    if (a.key > b.key)
      return 1

    return 0
  })

  const name = names.map(item => `${item.key.replace(/[^a-z0-9]/ig, '')}-${item.val.replace(/[^a-z0-9]/ig, '')}`).join('_')

  return {
    price: (price + (additionalOptionsCents / 100)) * (quantityDiscountPercent / 100),
    name: name || 'Default Title',
  }
}
// get variant with particular name
export function getVariantByName(product: Product, name: string): Variant | null {
  const variants = product.variants as Variant[]
  const l = variants.length ?? 0

  for (let i = 0; i < l; i++) {
    if (variants[i].option1 === name)
      return variants[i]
  }
  // special case for default variant
  if (name === 'Default Title' && 0 in variants)
    return variants[0]

  return null
}
