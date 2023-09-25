import type { APIGatewayEvent, APIGatewayProxyEventMultiValueQueryStringParameters, Context } from 'aws-lambda'
import { handler } from './index'

// const event = {
//   body: null,
//   resource: '/get-all-products',
//   multiValueQueryStringParameters: {

//   },
// } as APIGatewayEvent

const event = {
  body: null,
  resource: '/create',
  multiValueQueryStringParameters: {
    productid: ['7199896109090'],
  } as APIGatewayProxyEventMultiValueQueryStringParameters,
} as APIGatewayEvent

console.log(JSON.parse((await handler(event, {} as Context)).body))
