'use strict';

const path = require('path');
const expect = require('chai').expect;
const AWS = require('aws-sdk');
const _ = require('lodash');
const fetch = require('node-fetch');

const createTestService = require('../../utils').createTestService;
const deployService = require('../../utils').deployService;
const removeService = require('../../utils').removeService;
const region = require('../../utils').testRegion;

const CF = new AWS.CloudFormation({ region });

describe('AWS - API Gateway Integration Test', () => {
  let serviceName;
  let endpoint;
  let StackName;

  beforeAll(() => {
    serviceName = createTestService('aws-nodejs', path.join(__dirname, 'service'));
    StackName = `${serviceName}-dev`;
    deployService();
  });

  afterAll(() => {
    removeService();
  });

  describe('For all test cases', () => {
    it('should expose the endpoint(s) in the CloudFormation Outputs', () =>
      CF.describeStacks({ StackName }).promise()
        .then((result) => _.find(result.Stacks[0].Outputs,
          { OutputKey: 'ServiceEndpoint' }).OutputValue)
        .then((endpointOutput) => {
          endpoint = endpointOutput.match(/https:\/\/.+\.execute-api\..+\.amazonaws\.com.+/)[0];
          endpoint = `${endpoint}`;
        })
    );
  });

  describe('Minimal setup', () => {
    const expectedMessage = 'Hello from API Gateway! - (minimal)';

    it('should expose an accessible GET HTTP endpoint', () => {
      const testEndpoint = `${endpoint}`;

      return fetch(testEndpoint, { method: 'GET' })
        .then(response => response.json())
        .then((json) => expect(json.message).to.equal(expectedMessage));
    });

    it('should expose an accessible POST HTTP endpoint', () => {
      const testEndpoint = `${endpoint}/minimal-1`;

      return fetch(testEndpoint, { method: 'POST' })
        .then(response => response.json())
        .then((json) => expect(json.message).to.equal(expectedMessage));
    });

    it('should expose an accessible PUT HTTP endpoint', () => {
      const testEndpoint = `${endpoint}/minimal-2`;

      return fetch(testEndpoint, { method: 'PUT' })
        .then(response => response.json())
        .then((json) => expect(json.message).to.equal(expectedMessage));
    });

    it('should expose an accessible DELETE HTTP endpoint', () => {
      const testEndpoint = `${endpoint}/minimal-3`;

      return fetch(testEndpoint, { method: 'DELETE' })
        .then(response => response.json())
        .then((json) => expect(json.message).to.equal(expectedMessage));
    });
  });
});
