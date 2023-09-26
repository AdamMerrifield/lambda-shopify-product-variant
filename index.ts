import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'
import process from 'node:process'
import type { ConfigParams } from '@shopify/shopify-api'
import { shopifyApi } from '@shopify/shopify-api'
import type { FindAllResponse } from '@shopify/shopify-api/rest/base'
import { restResources } from '@shopify/shopify-api/rest/admin/2023-07'
import type { Product } from '@shopify/shopify-api/rest/admin/2023-07/product'
import type { Metafield } from '@shopify/shopify-api/rest/admin/2023-07/metafield'
import type { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import type { Variant } from '@shopify/shopify-api/rest/admin/2023-07/variant'
import type { CartItemProps, ProductCustomizerValue, ProductWithMeta } from 'src/types'

// setup shopify api
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  scopes: ['write_products', 'read_products'],
  hostName: process.env.SHOPIFY_STORE,
  isCustomStoreApp: true,
  isEmbeddedApp: false,
  restResources,
} as ConfigParams)
const session = shopify.session.customAppSession(shopify.config.hostName)
// handle all requests
export async function handler(event: APIGatewayEvent, _context: Context): Promise<APIGatewayProxyResult> {
  // console.log(event.multiValueQueryStringParameters, event.resource)

  if (event.resource === '/create') {
    const response = {
      statusCode: 200,
      body: JSON.stringify(await createVariant(event.multiValueQueryStringParameters?.productid?.shift())),
    }

    return response
  }
  // else if (event.resource === '/update') {

  // }
  else if (event.resource === '/get-all-products') {
    const response = {
      statusCode: 200,
      body: JSON.stringify(await getAllProducts()),
    }

    return response
  }
  // all else fail
  const response = {
    statusCode: 400,
    body: '',
  }

  return response
}
// get all products in this store
async function getAllProducts(): Promise<Product[]> {
  const products: FindAllResponse<Product> = await shopify.rest.Product.all({
    session,
  })

  return products.data
}
// create a new product variant
async function createVariant(id?: string) {
  const { product, meta } = await getProduct(id)

  if (product.variants?.length >= 100)
    console.error(`productid ${id} has max variants`)

  console.log({ product, meta })

  return product
}
// get product and product meta data
async function getProduct(id?: string): Promise<ProductWithMeta> {
  const productPromise: Promise<Product> = shopify.rest.Product.find({
    session,
    id,
  })

  const metaPromise: Promise<FindAllResponse<Metafield>> = shopify.rest.Metafield.all({
    session,
    metafield: { owner_id: id, owner_resource: 'product' },
  })

  await Promise.all([productPromise, metaPromise])

  const product = await productPromise
  const meta = await metaPromise

  return { product, meta: meta.data }
}
