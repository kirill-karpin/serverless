const AWS = require('aws-sdk');

function putCloudWatchEvents(sources) {
  const cwe = new AWS.CloudWatchEvents({ region: 'us-east-1' });

  const entries = [];
  sources.forEach(source => {
    entries.push({
      Source: source,
      DetailType: 'serverlessDetailType',
      Detail: '{ "key1": "value1" }',
    });
  });
  const params = {
    Entries: entries,
  };
  return cwe.putEvents(params).promise();
}

module.exports = {
  putCloudWatchEvents,
};
