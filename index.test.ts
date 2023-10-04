import { handler } from './index'

const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: '',
  functionVersion: '',
  invokedFunctionArn: '',
  memoryLimitInMB: '',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  getRemainingTimeInMillis: () => 1,
  done: () => {},
  fail: () => {},
  succeed: () => {},
}
const event = {
  version: '2.0',
  routeKey: 'ANY /create',
  rawPath: '/create',
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: '',
    apiId: '',
    domainName: '',
    domainPrefix: '',
    http: {
      method: 'POST',
      path: '/create',
      protocol: 'https',
      sourceIp: '',
      userAgent: '',
    },
    requestId: '',
    routeKey: '',
    stage: '',
    time: '',
    timeEpoch: 1,
  },
  body:
  JSON.stringify({ 'properties[_discount_key]': '25:3,50:5,100:10,150:13,250:18,500:30,750:47,1000:56,1250:61,1500:65,1750:68,2000:69,2500:71', 'id': '41256973893684', 'productid': '522626203700', 'properties[Paper Stock]': '19pt Savoy Cotton Brilliant White', 'properties[Orientation]': 'Portrait', 'properties[Sides]': 'Single-sided', 'properties[Rounded Corners]': 'Yes', 'properties[Project Name]': '', 'quantity': '2500', 'properties[front_image]': 'https://cdn.filestackcontent.com/WloE5FaSSrOqDewhOK4L', 'properties[front_image_client]': 'computer', 'properties[back_image]': '', 'properties[back_image_client]': '' } as any),
  isBase64Encoded: false,
}

console.log(JSON.parse((await handler(event, context)).body))
