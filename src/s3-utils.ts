import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export async function getPresignedUploadUrlForLogo(key: string) {
  const client = new S3Client({ region: 'us-east-2' })
  const command = new PutObjectCommand({ Bucket: 'shopify-customer-logos', Key: key })

  return await getSignedUrl(client, command, { expiresIn: 3600 })
}
