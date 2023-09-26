import type { APIGatewayEvent, APIGatewayProxyEventMultiValueQueryStringParameters, Context } from 'aws-lambda'
import { handler } from './index'

// const event = {
//   body: null,
//   resource: '/get-all-products',
//   multiValueQueryStringParameters: {

//   } as APIGatewayProxyEventMultiValueQueryStringParameters,
// } as APIGatewayEvent

const event = {
  body: null,
  resource: '/create',
  multiValueQueryStringParameters: {
    productid: ['522626203700'],
    quantity: ['25'],
    properties: ['a=b', 'Rounded Corners=Yes'],
  } as APIGatewayProxyEventMultiValueQueryStringParameters,
} as APIGatewayEvent

console.log(JSON.parse((await handler(event, {} as Context)).body))
