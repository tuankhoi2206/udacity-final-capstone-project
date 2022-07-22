Serverless TODO - Enhancement
According to my Todo project of course 4. This application will add a feature notify users who has tasks has one/two day left

Functions implemented
In this project, I added 2 functions to notify the users in serverless.yml file:

Function 1: Triggerd by scheduler to get all todo items with value of done column is false and publish message to SNS.

filterWarningMessage.ts 
const result = await this.docClient.scan({
            TableName: this.todosTable,
            FilterExpression: 'done = :done',
            ExpressionAttributeValues: {
                ':done': false
            },
        }).promise()

exports.handler = async function() {
    AWS.config.update({region: region});
    var lstTodo = await getAllTodoNotDone();
    console.log("List Todo:", lstTodo);
    lstTodo.forEach(item => {
        if (checkTwoDayLeft(item.dueDate)) {
            let msg = `Warning (${item.userId}): your task [${item.name}] has two day left. Please finish it.`;
            console.log(`Send message: ${msg}`)
            var params = {
                Message: msg, 
                Subject: "List Todo have not done yet",
                TopicArn: topicArn
            };
            var publishTextPromise = new AWS.SNS({apiVersion: apiVersion}).publish(params).promise();

            publishTextPromise.then(
            function(data) {
                console.log(`Message (${data.MessageId}) ${params.Message} sent to the topic ${params.TopicArn}`);
            }).catch(
                function(err) {
                console.error(err, err.stack);
            });
        }
    });
};

function checkTwoDayLeft(compareDate:string): boolean {
    var currentDay = new Date();
    var compareDay = new Date(compareDate);
    var leftTime = compareDay.getTime() - currentDay.getTime();
    var dayDiff = leftTime / (1000 * 60 * 60 * 24);
    return (dayDiff > 0 && dayDiff <= 2);
}

Function 2: receive todo will notify to user, write the content of message out to console (CloudWatch) and send message to SNS
sendWarningNotification.ts
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

Serverless.yml :
#-----> update enhancement <------
  FilterWarningTodo:
    handler: src/lambda/scheduler/filterWarningMessage.handler
    events:
      - schedule:
          rate: rate(1 minute)
          enabled: true
    iamRoleStatements:
      - Effect: Allow
        Action:
          - sns:*
        Resource: "*"
      - Effect: Allow
        Action:
          - dynamodb:Scan
          - dynamodb:GetItem
        Resource: arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}
    environment:
      AWS_ACCOUNT_ID: ${aws:accountId}
  SendWarningNotification:
    handler: src/lambda/sns/sendWarningNotification.handler
    events:
      - sns:
          arn:
            Fn::Join:
              - ':'
              - - arn:aws:sns
                - Ref: AWS::Region
                - Ref: AWS::AccountId
                - ${self:provider.environment.SNS_WARNING_TODO_TOPIC}
          topicName: ${self:provider.environment.SNS_WARNING_TODO_TOPIC}
  #-----> end enhancement <------
resources:
  Resources:
    GatewayResponseDefault4XX:
      Type: AWS::ApiGateway::GatewayResponse
      Properties:
        ResponseParameters:
          gatewayresponse.header.Access-Control-Allow-Origin: "'*'"
          gatewayresponse.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
          gatewayresponse.header.Access-Control-Allow-Methods: "'GET,OPTIONS,POST'"
        ResponseType: DEFAULT_4XX
        RestApiId:
          Ref: ApiGatewayRestApi

    RequestBodyValidator:
      Type: AWS::ApiGateway::RequestValidator
      Properties:
        Name: 'request-body-validator'
        RestApiId:
          Ref: ApiGatewayRestApi
        ValidateRequestBody: true
        ValidateRequestParameters: false      
    
    
    TodosTable:
      Type: AWS::DynamoDB::Table
      Properties:
        AttributeDefinitions:
          - AttributeName: todoId
            AttributeType: S
          - AttributeName: userId
            AttributeType: S
          - AttributeName: createdAt
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
          - AttributeName: todoId
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
        TableName: ${self:provider.environment.TODOS_TABLE}
        GlobalSecondaryIndexes:
          - IndexName: ${self:provider.environment.TODOS_BY_USER_INDEX}
            KeySchema:
              - AttributeName: userId
                KeyType: HASH
              - AttributeName: createdAt
                KeyType: RANGE
            Projection:
              ProjectionType: ALL


    AttachmentsBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.ATTACHMENT_S3_BUCKET}
        CorsConfiguration:
          CorsRules:
            - AllowedOrigins:
                - '*'
              AllowedHeaders:
                - '*'
              AllowedMethods:
                - GET
                - PUT
                - POST
                - DELETE
                - HEAD
              MaxAge: 3000

    BucketPolicy:
      Type: AWS::S3::BucketPolicy
      Properties:
        PolicyDocument:
          Id: MyPolicy
          Version: '2012-10-17'
          Statement:
            - Sid: PublicReadForGetBucketObjects
              Effect: Allow
              Principal: '*'
              Action: 's3:GetObject'
              Resource: 'arn:aws:s3:::${self:provider.environment.ATTACHMENT_S3_BUCKET}/*'
        Bucket: !Ref AttachmentsBucket
    #-----> update enhancement <------
