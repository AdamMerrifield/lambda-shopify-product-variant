import type { APIGatewayProxyEventHeaders, APIGatewayProxyEventV2, Context } from 'aws-lambda'
import { handler } from './index'

const event = {
  version: '2.0',
  routeKey: 'ANY /create',
  rawPath: '/create',
  rawQueryString: '',
  headers: {} as APIGatewayProxyEventHeaders,
  requestContext: {},
  body:
  JSON.stringify({ 'properties[_discount_key]': '25:3,50:5,100:10,150:13,250:18,500:30,750:47,1000:56,1250:61,1500:65,1750:68,2000:69,2500:71', 'id': '6893183500340', 'productid': '522626203700', 'properties[Paper Stock]': '120# Mohawk Superfine Eggshell Ultrawhite', 'properties[Orientation]': 'Portrait', 'properties[Sides]': 'Single-sided', 'properties[Rounded Corners]': 'No', 'properties[Project Name]': '', 'quantity': '800', 'properties[front_image]': 'https://cdn.filestackcontent.com/WloE5FaSSrOqDewhOK4L', 'properties[front_image_client]': 'computer', 'properties[back_image]': '', 'properties[back_image_client]': '' } as any),
  isBase64Encoded: false,
} as APIGatewayProxyEventV2

console.log(JSON.parse((await handler(event, {} as Context)).body))
