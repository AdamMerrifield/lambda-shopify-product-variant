import 'dotenv/config'
import process from 'node:process'
import { createAdminApiClient } from '@shopify/admin-api-client'
import { LATEST_API_VERSION } from '@shopify/shopify-api'

const client = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE!,
  apiVersion: LATEST_API_VERSION,
  accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
  retries: 3,
})

export async function updateAllProductsWithStockMeta(paperStockValue: Record<string, any>) {
  const products = await getAllProductsWithStockMeta()

  for (const key in products) {
    for (const productId of products[key]) {
      // console.log({ key, productId })

      if (key === 'base') {
        updateProductStockMeta(productId, 'customizer', paperStockValue)
      }
      else {
        const basePaperstock = { position: '0000001000', type: 'select', options: '', option_prices: '', description: '', placeholder: 'Please choose one', required: '1', label: '', fonts: '0', option_id: '746585', product_option_id: '14174152', name: 'Paper Stock' }
        const options = []
        const optionsPrices = []
        const divisor = Number.parseInt(key.replace(/\D/g, ''), 10)

        for (const key in paperStockValue) {
          options.push(paperStockValue[key].name)
          optionsPrices.push(Math.round(paperStockValue[key].price / divisor))
        }

        basePaperstock.options = options.join(',')
        basePaperstock.option_prices = optionsPrices.join(',')

        // console.log({ divisor, options, optionsPrices, basePaperstock })
        updateProductStockMeta(productId, 'product_customizer', basePaperstock)
      }
    }
  }

  // console.log(products)

  return {
    success: true,
  }
}

async function updateProductStockMeta(productId: string, namespace: string, value: Record<string, any>) {
  const input = {
    id: productId,
    metafields: [{
      namespace,
      key: 'Paper Stock',
      value: JSON.stringify(value),
      type: 'json',
    }],
  }

  const { data, errors } = await client.request(`#graphql
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        metafields(first: 100) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`, {
    variables: {
      input,
    },
  })

  console.log(data?.productUpdate?.userErrors)

  if (errors) {
    console.log(errors, errors?.graphQLErrors?.[0].locations)
  }
  else if (data?.productUpdate?.product?.metafields?.edges && namespace === 'product_customizer') {
    console.log(data.productUpdate.product.metafields.edges)

    for (const val of data.productUpdate.product.metafields.edges) {
      if (val.node.namespace === 'product_customizer' && val.node.key !== 'Paper Stock' && val.node.value.includes('"name":"Paper Stock"'))
        removeProductMetafield(val.node.id)
    }
  }
}

async function removeProductMetafield(id: string) {
  const input = {
    id,
  }

  const { data, errors } = await client.request(`#graphql
  mutation metafieldDelete($input: MetafieldDeleteInput!) {
    metafieldDelete(input: $input) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`, {
    variables: {
      input,
    },
  })

  if (errors)
    console.log(errors, errors?.graphQLErrors?.[0].locations)

  // console.log(data)
}

export async function getAllProductsWithStockMeta() {
  const products: Record<string, string[]> = {
    'base': [],
    '1 up': [],
    '2 up': [],
    '4 up': [],
    '8 up': [],
    '16 up': [],
    '32 up': [],
  }

  let cursor: null | string = null

  do {
    const data = await getProducts(cursor)

    if (data) {
      for (let i = 0; i < data.nodes.length; i++) {
        const product = data.nodes[i]

        if (product.metafield) {
          const key = product.metafield.value.trim()

          if (key in products) {
            products[key].push(product.id)
          }
          else if (product.handle === 'bulk-product-paper-base-product-do-not-delete') {
            products.base.push(product.id)
          }
          else {
            console.log(`Product has invalid paper stock meta field, ${product.id}`)
            console.log(product)
          }
        }
      }

      cursor = data.pageInfo.endCursor ?? null
      // console.log({ cursor })
    }
    else {
      // kill loop
      cursor = null
    }
  } while (cursor !== null)

  return products
}

async function getProducts(cursor: string | null = null) {
  const { data, errors } = await client.request(`#graphql
  query ProductsQuery($numProducts: Int!, $cursor: String){
    products(first: $numProducts, after: $cursor) {
      nodes {
        id
        title
        handle

        metafield(namespace: "customizer", key: "Paper Stock") {
          value
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`, {
    variables: {
      numProducts: 250,
      cursor,
    },
  })

  return data?.products ?? null
}
