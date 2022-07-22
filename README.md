Serverless TODO - Enhancement
According to my Todo project of course 4. This application will add a feature notify users who has tasks has one/two day left

Alt text

Functions to be implemented
To enhance this project, I added 2 functions to notify the users in serverless.yml file:

filterWarningMessage.ts - This function is triggerd by scheduler (time to trigger depends on the config) to get all todo items in which value of done column is false and publish message to SNS. (Note: Since I have to find all item which the value of done is false not based on userId so I used scan()).
const result = await this.docClient.scan({
            TableName: this.todosTable,
            FilterExpression: 'done = :done',
            ExpressionAttributeValues: {
                ':done': false
            },
        }).promise()
Send message to SNS
Alt text

sendWarningMsgNotification.ts - receive todo items need to notify to user. To simpler I just write the content of message out to console.
Alt text

Serverless.yml :
functions:
  ....
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

  SendWarningMsgNotification:
    handler: src/lambda/sns/sendWarningMsgNotification.handler
    events:
      - sns:
          arn:
            Fn::Join:
              - ':'
              - - arn:aws:sns
                - Ref: AWS::Region
                - Ref: AWS::AccountId
                - ${self:provider.environment.SNS_WARNING_TOPIC}
          topicName: ${self:provider.environment.SNS_WARNING_TOPIC}
Frontend
Show popup when the user does not input name of todo.
Alt text

Show popup when the user inputs name of todo that contains special characters.
Alt text

Disable Todo Item that is expired. Not to allow the user manipulates actions such as: edit/delete/check-uncheck
Alt text
