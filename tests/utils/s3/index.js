const AWS = require('aws-sdk');

function createAndRemoveInBucket(bucketName) {
  const S3 = new AWS.S3({ region: 'us-east-1' });

  const params = {
    Bucket: bucketName,
    Key: 'object',
    Body: 'hello world',
  };

  return S3.putObject(params).promise()
    .then(() => {
      delete params.Body;
      return S3.deleteObject(params);
    });
}

module.exports = {
  createAndRemoveInBucket,
};
