const AWS = require('aws-sdk');

function getCognitoUserPoolId(userPoolName) {
  const cisp = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

  const params = {
    MaxResults: 50,
  };

  return cisp.listUserPools(params).promise()
    .then((data) => data.UserPools.find((userPool) =>
      RegExp(userPoolName, 'g').test(userPool.Name)).Id
    );
}

function createCognitoUser(userPoolId, username, password) {
  const cisp = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

  const params = {
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
  };
  return cisp.adminCreateUser(params).promise();
}

module.exports = {
  getCognitoUserPoolId,
  createCognitoUser,
};
