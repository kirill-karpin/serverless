'use strict';

const AWS = require('aws-sdk');
const BbPromise = require('bluebird');

const region = 'us-east-1';

const logger = console;

// S3
const S3 = new AWS.S3({ region });

function emptyBucket(bucket) {
  return S3.listObjects({ Bucket: bucket })
    .promise()
    .then(data => {
      const items = data.Contents;
      const numItems = items.length;
      logger.log(`Bucket ${bucket} has ${numItems} items`);
      if (numItems) {
        const keys = items.map(item => Object.assign({}, { Key: item.Key }));
        return S3.deleteObjects({
          Bucket: bucket,
          Delete: {
            Objects: keys,
          },
        }).promise();
      }
      return null;
    });
}

function deleteBucket(bucket) {
  return emptyBucket(bucket).then(() => {
    logger.log(`Bucket ${bucket} is now empty, deleting...`);
    return S3.deleteBucket({ Bucket: bucket }).promise();
  });
}

function deleteAllBuckets(token) {
  logger.log('Looking through buckets ...');

  const params = {};
  if (token) {
    params.NextToken = token;
  }

  return S3.listBuckets()
    .promise()
    .then(data =>
      data.Buckets.reduce(
        (accum, bucket) => accum.then(() => deleteBucket(bucket.Name)),
        BbPromise.resolve()
      ).then(() => {
        if (data.NextToken) {
          return deleteAllBuckets(data.NextToken);
        }
        return null;
      })
    );
}

// CloudFormation
const CF = new AWS.CloudFormation({ region });

function deleteAllStacks(token) {
  logger.log('Looking through stacks ...');

  const params = {
    StackStatusFilter: [
      'CREATE_FAILED',
      'CREATE_COMPLETE',
      'ROLLBACK_FAILED',
      'ROLLBACK_COMPLETE',
      'DELETE_FAILED',
      'UPDATE_ROLLBACK_FAILED',
      'UPDATE_ROLLBACK_COMPLETE',
    ],
  };
  if (token) {
    params.NextToken = token;
  }

  return CF.listStacks(params)
    .promise()
    .then(data =>
      data.StackSummaries.reduce((memo, stack) => {
        if (
          ['DELETE_COMPLETE', 'DELETE_IN_PROGRESS'].indexOf(
            stack.StackStatus
          ) === -1
        ) {
          logger.log('Deleting stack', stack.StackName);
          return memo.then(() =>
            CF.deleteStackPromised({ StackName: stack.StackName })
          );
        }
        return memo;
      }, BbPromise.resolve()).then(() => {
        if (data.NextToken) {
          return deleteAllStacks(data.NextToken);
        }
        return null;
      })
    );
}

function cleanup() {
  return deleteAllBuckets()
    .then(deleteAllStacks);
}

module.exports = cleanup;
