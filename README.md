## Serverless TODO - Enhancement
    According to my Todo project of course 4. This application will add a feature notify users who has tasks has one/two day left

## Functions implemented
    In this project, I added 2 functions to notify the users in serverless.yml

## Function 1:
    Triggerd by scheduler to get all todo items with value of done column is false and publish message to SNS.

filterWarningMessage.ts
```ts
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
```
## Function 2:
    Receive todo will notify to user, write the content of message out to console (CloudWatch) and send message to SNS
    
sendWarningNotification.ts
```ts
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
```
## Send message to SNS
![Alt text](final-capstone-image/cloudwatch_log.png?raw=true "Image 1")

Serverless.yml :
![Alt text](final-capstone-image/serverless_update.png?raw=true "Image 2")

## Database
![Alt text](final-capstone-image/Database.png?raw=true "Image 3")

## API Validation Request 
![Alt text](final-capstone-image/final-capstone-image?raw=true "Image 4")

## Frontend Validation Request 
![Alt text](final-capstone-image/frontend_validation_request.png?raw=true "Image 5")
