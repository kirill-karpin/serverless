const AWS = require('aws-sdk');

function createSnsTopic(topicName) {
  const SNS = new AWS.SNS({ region: 'us-east-1' });

  const params = {
    Name: topicName,
  };

  return SNS.createTopic(params).promise();
}

function removeSnsTopic(topicName) {
  const SNS = new AWS.SNS({ region: 'us-east-1' });

  return SNS.listTopics().promise()
    .then(data => {
      const topicArn = data.Topics.find(topic => RegExp(topicName, 'g')
        .test(topic.TopicArn)).TopicArn;

      const params = {
        TopicArn: topicArn,
      };

      return SNS.deleteTopic(params).promise();
    });
}

function publishSnsMessage(topicName, message) {
  const SNS = new AWS.SNS({ region: 'us-east-1' });

  return SNS.listTopics().promise()
    .then(data => {
      const topicArn = data.Topics.find(topic => RegExp(topicName, 'g')
        .test(topic.TopicArn)).TopicArn;

      const params = {
        Message: message,
        TopicArn: topicArn,
      };

      return SNS.publish(params).promise();
    });
}

module.exports = {
  createSnsTopic,
  removeSnsTopic,
  publishSnsMessage,
};
