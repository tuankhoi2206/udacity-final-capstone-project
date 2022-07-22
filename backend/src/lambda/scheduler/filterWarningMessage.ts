import * as AWS from 'aws-sdk'
import { getAllTodoNotDone } from  '../../businessService/todosService'

const snsWarningTopic = process.env.SNS_WARNING_TODO_TOPIC
const accountId = process.env.AWS_ACCOUNT_ID
const region = process.env.REGION
const apiVersion = '2022-07-22';
const topicArn = "arn:aws:sns:" + region + ":" + accountId + ":" + snsWarningTopic;

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