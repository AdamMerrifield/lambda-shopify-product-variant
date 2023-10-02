import type { APIGatewayProxyEventHeaders, APIGatewayProxyEventV2, Context } from 'aws-lambda'
import { handler } from './index'

const event = {
  version: '2.0',
  routeKey: 'ANY /create',
  rawPath: '/create',
  rawQueryString: '',
  headers: {} as APIGatewayProxyEventHeaders,
  requestContext: {},
  body: '{"properties[_discount_key]":"25:3,50:5,100:10,150:13,250:18,500:30,750:47,1000:56,1250:61,1500:65,1750:68,2000:69,2500:71","id":"6893183500340","productid":"522626203700","quantity":"1","properties[Paper Stock]":"110# Ecru Felt","properties[Orientation]":"Portrait","properties[Sides]":"Single-sided","properties[Rounded Corners]":"Yes","properties[Project Name]":"","properties[_pc_pricing_ref]":"","properties[_pc_pricing_qty]":"","properties[front_image]":"https://cdn.filestackcontent.com/ASZohxGaTb6Vdb2pF0MA","properties[front_image_client]":"computer","properties[back_image]":"","properties[back_image_client]":""}',
  isBase64Encoded: false,
} as APIGatewayProxyEventV2

console.log(JSON.parse((await handler(event, {} as Context)).body))
