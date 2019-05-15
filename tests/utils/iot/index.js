const AWS = require('aws-sdk');

function publishIotData(topic, message) {
  const Iot = new AWS.Iot({ region: 'us-east-1' });

  return Iot.describeEndpoint().promise()
    .then(data => {
      const IotData = new AWS.IotData({ region: 'us-east-1', endpoint: data.endpointAddress });

      const params = {
        topic,
        payload: new Buffer(message),
      };

      return IotData.publish(params).promise();
    });
}

module.exports = {
  publishIotData,
};
