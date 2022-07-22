import { SNSEvent, SNSHandler } from 'aws-lambda'
import 'source-map-support/register'

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log('Processing SNS event ', JSON.stringify(event))
    for (const snsRecord of event.Records) {
      const s3EventStr = snsRecord.Sns.Message
      console.log('Message datails: ', s3EventStr)
      const s3Event = JSON.parse(s3EventStr)
  
      for (const record of s3Event.Records) {
        console.log(`Details of events: ${record}`)
      }
    }
  }