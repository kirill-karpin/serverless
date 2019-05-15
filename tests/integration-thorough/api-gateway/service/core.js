'use strict';

async function minimal(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from API Gateway! - (minimal)',
      input: event,
    }),
  };
}

async function cors(event) {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Hello from API Gateway! - (cors)',
      input: event,
    }),
  };
}

async function customAuthorizers(event) {
  return ({
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from API Gateway! - (customAuthorizers)',
      event,
    }),
  });
}

async function apiKeys(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from API Gateway! - (apiKeys)',
      input: event,
    }),
  };
}

module.exports = {
  minimal,
  cors,
  customAuthorizers,
  apiKeys,
};
