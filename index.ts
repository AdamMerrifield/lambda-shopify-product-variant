import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { LATEST_API_VERSION, shopifyApi } from '@shopify/shopify-api'
import type { FindAllResponse } from '@shopify/shopify-api/rest/base'
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04'
import type { Product } from '@shopify/shopify-api/rest/admin/2024-04/product'
import type { Metafield } from '@shopify/shopify-api/rest/admin/2024-04/metafield'
import type { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda'
import type { Variant } from '@shopify/shopify-api/rest/admin/2024-04/variant'
import { v4 as uuidv4 } from 'uuid'
import type { CartItemProps, ProductWithMeta } from './src/types'
import { calcPriceAndName, getVariantByName } from './src/utils'
import { getAllProductsWithStockMeta, updateAllProductsWithStockMeta, updateCustomerMetafield } from '~/graphql'
import { getPresignedUploadUrlForLogo } from '~/s3-utils'

// setup shopify api
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY!,
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  scopes: ['write_products', 'read_products'],
  hostName: process.env.SHOPIFY_STORE!,
  isCustomStoreApp: true,
  isEmbeddedApp: false,
  apiVersion: LATEST_API_VERSION,
  restResources,
})
const session = shopify.session.customAppSession(shopify.config.hostName)
// handle all requests
export async function handler(event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyResult> {
  let body: any = null

  try {
    if (event.rawPath === '/create') {
      const postData: Record<string, any> = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters

      const productid = Number.parseInt(postData?.productid ?? '0', 10)
      const quantity = Number.parseInt(postData?.quantity ?? '1', 10)
      const currentVariantsInCart: string[] = postData?._currentVariantsInCart ?? []
      const properties: CartItemProps = {}

      for (const name in postData) {
        if (name.startsWith('properties'))
          properties[name.replace(/properties\[(.+)\]/, '$1')] = postData[name]
      }

      body = { variantid: await createVariant(productid, quantity, properties, currentVariantsInCart) }
    }
    else if (event.rawPath === '/get-product') {
      const postData: Record<string, any> = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters
      const productid = Number.parseInt(postData?.productid ?? '0', 10)

      body = await getProductWithMeta(productid)
    }
    else if (event.rawPath === '/get-all-products') {
      body = await getAllProducts()
    }
    else if (event.rawPath === '/get-all-products-with-stock-meta') {
      body = await getAllProductsWithStockMeta()
    }
    else if (event.rawPath === '/update-all-products-with-stock-meta') {
      const postData: Record<string, any> = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters

      body = await updateAllProductsWithStockMeta(postData)
    }
    else if (event.rawPath === '/get-logo-upload-url') {
      const postData: Record<string, any> = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters

      const key = uuidv4()
      const name = `${key}.${postData.ext}`

      body = {
        key,
        name,
        url: await getPresignedUploadUrlForLogo(name),
      }
    }
    else if (event.rawPath === '/update-customer-logo') {
      const postData: Record<string, any> = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('ascii') : event.body) : event.queryStringParameters

      const customerid = postData.cid
      const logoValue = postData.name

      await updateCustomerMetafield(customerid, logoValue)

      body = { success: true }
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
async function createVariant(id: number, quantity: number, properties: CartItemProps, currentVariantsInCart: string[]) {
  const { product, meta } = await getProductWithMeta(id)
  const { price, name } = calcPriceAndName(product, meta, quantity, properties)
  // force add default to `currentVariantsInCart` list for all products
  currentVariantsInCart.push('Default Title')

  const variantByName = getVariantByName(product, name, currentVariantsInCart)

  if (variantByName !== null) {
    if (Number.parseFloat(variantByName.price ?? '0') !== price) {
      console.error(`Product variant pricing mismatch productid: ${product.id}, variantid: ${variantByName.id} old price: ${variantByName.price}, new price: ${price}`)
      // create variant for updating
      const variant = new shopify.rest.Variant({
        session,
      })
      Object.assign(variant, variantByName)
      // update variant pricing
      variant.price = price.toFixed(2)

      await variant.save({
        update: true,
      })

      return variant.id
    }

    return variantByName.id
  }
  // if we did not find the variant already created, make a new one
  if (product.variants?.length >= 250)
    console.error(`productid ${id} has max variants`)

  const defaultVariant = getVariantByName(product, 'Default Title')

  if (defaultVariant === null)
    throw new Error(`Can not find default variant for productid: ${id}`)
  // setup new variant
  const variant = new shopify.rest.Variant({
    session,
  })

  variant.product_id = id
  // add suffix to the name if the user already has this variant in their cart
  let option1 = name
  let i = 0
  while (currentVariantsInCart.includes(option1))
    option1 = `${name}__${i++}`

  variant.option1 = option1
  variant.price = price.toFixed(2)
  variant.inventory_policy = 'continue'
  // copy some props from the default variant
  const copyProps: (keyof Variant)[] = ['sku', 'inventory_item_id', 'weight_unit', 'weight_unit', 'grams', 'taxable', 'tax_code', 'requires_shipping']
  copyProps.forEach((propName) => {
    variant[propName] = defaultVariant[propName]
  })

  await variant.save({ update: true })
  // return product variant
  return variant.id
}
// get product and product meta data
async function getProductWithMeta(id: number): Promise<ProductWithMeta> {
  const productPromise = shopify.rest.Product.find({
    session,
    id,
  })

  const metaPromise: Promise<FindAllResponse<Metafield>> = shopify.rest.Metafield.all({
    session,
    metafield: { owner_id: id, owner_resource: 'product' },
    limit: 250,
  })

  const [product, meta] = await Promise.all([productPromise, metaPromise])

  if (product === null)
    throw new Error('Invalid Product ID')

  return { product, meta: meta.data }
}
