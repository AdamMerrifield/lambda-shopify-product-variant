import '@shopify/shopify-api/adapters/node';
import {shopifyApi} from '@shopify/shopify-api';
import { restResources } from "@shopify/shopify-api/rest/admin/2023-07";
// setup shopify api
const shopify = shopifyApi({
  apiKey: 'f86f95131242da0365ba4b818ac4bd47',
  apiSecretKey: '9ef9d1dbdfb9fb8b5c3b152e689e2606',
  adminApiAccessToken: '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',
  scopes: ['write_products', 'read_products'],
  hostName: 'adamdev.myshopify.com',
  isCustomStoreApp: true,
  isEmbeddedApp: false,
  restResources,
});
const session = shopify.session.customAppSession('adamdev.myshopify.com');
// handle all requests
export const handler = async (event, context) => {
  console.log(event.multiValueQueryStringParameters, event.resource)

  if (event.resource === '/create') {

  } else if (event.resource === '/update') {

  } else if (event.resource === '/get-all-products') {
    const response = {
      statusCode: 200,
      body: JSON.stringify(await getAllProducts())
    };

    return response;
  }

  const response = {
    statusCode: 400,
  };
  return response;
}


const getAllProducts = async () => {
  const products = await shopify.rest.Product.all({
    session,
  });

  return products
}