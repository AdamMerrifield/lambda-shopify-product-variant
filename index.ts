import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import type { ConfigParams } from '@shopify/shopify-api'
import { ApiVersion, shopifyApi } from '@shopify/shopify-api'
import type { FindAllResponse } from '@shopify/shopify-api/rest/base'
import { restResources } from '@shopify/shopify-api/rest/admin/2023-07'
import type { Product } from '@shopify/shopify-api/rest/admin/2023-07/product'
import type { Metafield } from '@shopify/shopify-api/rest/admin/2023-07/metafield'
import type { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda'
import type { Variant } from '@shopify/shopify-api/rest/admin/2023-07/variant'
import type { CartItemProps, ProductWithMeta } from './src/types'
import { calcPriceAndName, getVariantByName } from './src/utils'

// setup shopify api
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  scopes: ['write_products', 'read_products'],
  hostName: process.env.SHOPIFY_STORE,
  isCustomStoreApp: true,
  isEmbeddedApp: false,
  apiVersion: ApiVersion.July23,
  restResources,
} as ConfigParams)
const session = shopify.session.customAppSession(shopify.config.hostName)
// handle all requests
export async function handler(event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyResult> {
  let body: null | any = null

  try {
    if (event.rawPath === '/create') {
      const postData: { [key: string]: any } = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters

      const productid: string = postData?.productid ?? '0'
      const quantity = Number.parseInt(postData?.quantity ?? '1', 10)
      const properties: CartItemProps = {}

      for (const name in postData) {
        if (name.startsWith('properties'))
          properties[name.replace(/properties\[(.+)\]/, '$1')] = postData[name]
      }

      body = { variantid: await createVariant(productid, quantity, properties) }
    }
    else if (event.rawPath === '/get-all-products') {
      body = await getAllProducts()
    }
  }
  catch (err) {
    // fail
    const response = {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(err),
    }

    return response
  }
  // success
  const response = {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }

  return response
}
// get all products in this store
async function getAllProducts(): Promise<Product[]> {
  let products: Product[] = []
  let pageInfo

  do {
    const response: FindAllResponse<Product> = await shopify.rest.Product.all({
      ...pageInfo?.nextPage?.query,
      session,
      limit: 250,
    })

    products = [...products, ...response.data]

    pageInfo = response.pageInfo
  } while (pageInfo?.nextPage)

  return products
}
// create a new product variant
async function createVariant(id: string, quantity: number, properties: CartItemProps) {
  const { product, meta } = await getProductWithMeta(id)
  const { price, name } = calcPriceAndName(product, meta, quantity, properties)

  const variantByName = getVariantByName(product, name)

  if (variantByName !== null) {
    if (Number.parseFloat(variantByName.price ?? '0') !== price) {
      console.error(`Product variant pricing mismatch productid: ${product.id}, variantid: ${variantByName.id} old price: ${variantByName.price}, new price: ${price}`)
      // update variant pricing
      variantByName.price = price.toFixed(2)
      await variantByName.save({
        update: true,
      })
    }

    return variantByName.id
  }
  // if we did not find the variant already created, make a new one
  if (product.variants?.length >= 100)
    console.error(`productid ${id} has max variants`)

  const defaultVariant = getVariantByName(product, 'Default Title')

  if (defaultVariant === null)
    throw new Error(`Can not find default variant for productid: ${id}`)
  // setup new variant
  const variant = new shopify.rest.Variant({
    session,
  })

  variant.product_id = id
  variant.option1 = name
  variant.price = price.toFixed(2)
  // copy some props from the default variant
  const copyProps: (keyof Variant)[] = ['sku', 'inventory_item_id', 'weight_unit', 'weight_unit', 'grams', 'taxable', 'tax_code', 'requires_shipping']
  copyProps.forEach((name: keyof Variant) => {
    variant[name] = defaultVariant[name]
  })

  await variant.save({ update: true })
  // return product variant
  return variant.id
}
// get product and product meta data
async function getProductWithMeta(id?: string): Promise<ProductWithMeta> {
  const productPromise: Promise<Product> = shopify.rest.Product.find({
    session,
    id,
  })

  const metaPromise: Promise<FindAllResponse<Metafield>> = shopify.rest.Metafield.all({
    session,
    metafield: { owner_id: id, owner_resource: 'product' },
    limit: 250,
  })

  await Promise.all([productPromise, metaPromise])

  const product = await productPromise
  const meta = await metaPromise

  if (product === null)
    throw new Error('Invalid Product ID')

  return { product, meta: meta.data }
}
