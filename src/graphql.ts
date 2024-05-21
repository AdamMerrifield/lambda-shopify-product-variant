import 'dotenv/config'
import process from 'node:process'
import { createAdminApiClient } from '@shopify/admin-api-client'
import { LATEST_API_VERSION } from '@shopify/shopify-api'

const client = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE!,
  apiVersion: LATEST_API_VERSION,
  accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
})

export async function getAllProductsWithStockMeta() {
  const operation = `
  query ProductQuery($id: ID!) {
    product(id: $id) {
      id
      title
      handle

      metafields (first:100) {
        edges {
          node {
            key
            value
          }
        }
      }
    }
  }
`

  const { data, errors, extensions } = await client.request(operation, {
    variables: {
      id: 'gid://shopify/Product/7446026977391',
    },
  })

  console.log({ data, errors, extensions })
}
