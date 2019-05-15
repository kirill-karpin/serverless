'use strict';

const os = require('os');
const path = require('path');
const crypto = require('crypto');
const fse = require('fs-extra');
const execSync = require('child_process').execSync;
const awsCleanup = require('./aws-cleanup');
const ServerlessPlugin = require('./plugins').ServerlessPlugin;
const installPlugin = require('./plugins').installPlugin;
const getTmpDirPath = require('./fs').getTmpDirPath;
const getTmpFilePath = require('./fs').getTmpFilePath;
const replaceTextInFile = require('./fs').replaceTextInFile;
const putCloudWatchEvents = require('./cloudwatch').putCloudWatchEvents;
const getCognitoUserPoolId = require('./cognito').getCognitoUserPoolId;
const createCognitoUser = require('./cognito').createCognitoUser;
const publishIotData = require('./iot').publishIotData;
const createAndRemoveInBucket = require('./s3').createAndRemoveInBucket;
const createSnsTopic = require('./sns').createSnsTopic;
const removeSnsTopic = require('./sns').removeSnsTopic;
const publishSnsMessage = require('./sns').publishSnsMessage;

const testRegion = 'us-east-1';

const serverlessExec = path.join(__dirname, '..', '..', 'bin', 'serverless');

function replaceEnv(values) {
  const originals = {};
  for (const key of Object.keys(values)) {
    if (process.env[key]) {
      originals[key] = process.env[key];
    } else {
      originals[key] = 'undefined';
    }
    if (values[key] === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }
  return originals;
}

const serviceNameRegex = /integ-test-\d+/;

function getServiceName() {
  const hrtime = process.hrtime();
  return `integ-test-${hrtime[1]}`;
}

function createTestService(templateName, testServiceDir) {
  const serviceName = getServiceName();
  const tmpDir = path.join(os.tmpdir(),
    'tmpdirs-serverless',
    'integration-test-suite',
    crypto.randomBytes(8).toString('hex'));

  fse.mkdirsSync(tmpDir);
  process.chdir(tmpDir);

  // create a new Serverless service
  execSync(`${serverlessExec} create --template ${templateName}`, { stdio: 'inherit' });

  if (testServiceDir) {
    fse.copySync(testServiceDir, tmpDir, { clobber: true, preserveTimestamps: true });
  }

  replaceTextInFile('serverless.yml', templateName, serviceName);

  process.env.TOPIC_1 = `${serviceName}-1`;
  process.env.TOPIC_2 = `${serviceName}-1`;
  process.env.BUCKET_1 = `${serviceName}-1`;
  process.env.BUCKET_2 = `${serviceName}-2`;
  process.env.COGNITO_USER_POOL_1 = `${serviceName}-1`;
  process.env.COGNITO_USER_POOL_2 = `${serviceName}-2`;

  // return the name of the CloudFormation stack
  return serviceName;
}

function deployService() {
  execSync(`${serverlessExec} deploy`, { stdio: 'inherit' });
}

function removeService() {
  execSync(`${serverlessExec} remove`, { stdio: 'inherit' });
}

function getFunctionLogs(functionName) {
  const logs = execSync(`${serverlessExec} logs --function ${functionName} --noGreeting true`);
  const logsString = new Buffer(logs, 'base64').toString();
  process.stdout.write(logsString);
  return logsString;
}

module.exports = {
  // cleanup
  awsCleanup,
  // core
  testRegion,
  serverlessExec,
  replaceEnv,
  serviceNameRegex,
  getServiceName,
  createTestService,
  deployService,
  removeService,
  getFunctionLogs,
  // filesystem
  getTmpDirPath,
  getTmpFilePath,
  replaceTextInFile,
  // plugins
  ServerlessPlugin,
  installPlugin,
  // services
  createAndRemoveInBucket,
  createSnsTopic,
  removeSnsTopic,
  publishSnsMessage,
  publishIotData,
  putCloudWatchEvents,
  getCognitoUserPoolId,
  createCognitoUser,
};
