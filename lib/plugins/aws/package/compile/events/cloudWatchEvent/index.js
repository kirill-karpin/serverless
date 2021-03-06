'use strict';

const _ = require('lodash');

class AwsCompileCloudWatchEventEvents {
  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'package:compileEvents': this.compileCloudWatchEventEvents.bind(this),
    };
  }

  compileCloudWatchEventEvents() {
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const functionObj = this.serverless.service.getFunction(functionName);
      let cloudWatchEventNumberInFunction = 0;

      if (functionObj.events) {
        functionObj.events.forEach(event => {
          if (event.cloudwatchEvent) {
            cloudWatchEventNumberInFunction++;
            let EventPattern;
            let State;
            let Input;
            let InputPath;
            let InputTransformer;
            let Description;
            let Name;

            if (typeof event.cloudwatchEvent === 'object') {
              if (!event.cloudwatchEvent.event) {
                const errorMessage = [
                  `Missing "event" property for cloudwatch event in function ${functionName}`,
                  ' Please check the docs for more info.',
                ].join('');
                throw new this.serverless.classes
                  .Error(errorMessage);
              }

              EventPattern = JSON.stringify(event.cloudwatchEvent.event);
              State = 'ENABLED';
              if (event.cloudwatchEvent.enabled === false) {
                State = 'DISABLED';
              }
              Input = event.cloudwatchEvent.input;
              InputPath = event.cloudwatchEvent.inputPath;
              InputTransformer = event.cloudwatchEvent.inputTransformer;
              Description = event.cloudwatchEvent.description;
              Name = event.cloudwatchEvent.name;

              const inputOptions = [Input, InputPath, InputTransformer].filter(i => i);
              if (inputOptions.length > 1) {
                const errorMessage = [
                  'You can only set one of input, inputPath, or inputTransformer ',
                  'properties at the same time for cloudwatch events. ',
                  'Please check the AWS docs for more info',
                ].join('');
                throw new this.serverless.classes.Error(errorMessage);
              }

              if (Input && typeof Input === 'object') {
                Input = JSON.stringify(Input);
              }
              if (Input && typeof Input === 'string') {
                // escape quotes to favor JSON.parse
                Input = Input.replace(/\"/g, '\\"'); // eslint-disable-line
              }
              if (InputTransformer) {
                InputTransformer = this.formatInputTransformer(InputTransformer);
              }
            } else {
              const errorMessage = [
                `CloudWatch event of function "${functionName}" is not an object`,
                ' Please check the docs for more info.',
              ].join('');
              throw new this.serverless.classes
                .Error(errorMessage);
            }

            const lambdaLogicalId = this.provider.naming
              .getLambdaLogicalId(functionName);
            const cloudWatchLogicalId = this.provider.naming
              .getCloudWatchEventLogicalId(functionName, cloudWatchEventNumberInFunction);
            const lambdaPermissionLogicalId = this.provider.naming
              .getLambdaCloudWatchEventPermissionLogicalId(functionName,
                cloudWatchEventNumberInFunction);
            const cloudWatchId = this.provider.naming.getCloudWatchEventId(functionName);

            const cloudWatchEventRuleTemplate = `
              {
                "Type": "AWS::Events::Rule",
                "Properties": {
                  "EventPattern": ${EventPattern.replace(/\\n|\\r/g, '')},
                  "State": "${State}",
                  ${Description ? `"Description": "${Description}",` : ''}
                  ${Name ? `"Name": "${Name}",` : ''}
                  "Targets": [{
                    ${Input ? `"Input": "${Input.replace(/\\n|\\r/g, '')}",` : ''}
                    ${InputPath ? `"InputPath": "${InputPath.replace(/\r?\n/g, '')}",` : ''}
                    ${InputTransformer ? `"InputTransformer": ${InputTransformer},` : ''}
                    "Arn": { "Fn::GetAtt": ["${lambdaLogicalId}", "Arn"] },
                    "Id": "${cloudWatchId}"
                  }]
                }
              }
            `;

            const permissionTemplate = `
              {
                "Type": "AWS::Lambda::Permission",
                "Properties": {
                  "FunctionName": { "Fn::GetAtt": ["${
              lambdaLogicalId}", "Arn"] },
                  "Action": "lambda:InvokeFunction",
                  "Principal": { "Fn::Join": ["", ["events.", { "Ref": "AWS::URLSuffix" }]] },
                  "SourceArn": { "Fn::GetAtt": ["${cloudWatchLogicalId}", "Arn"] }
                }
              }
            `;

            const newCloudWatchEventRuleObject = {
              [cloudWatchLogicalId]: JSON.parse(cloudWatchEventRuleTemplate),
            };

            const newPermissionObject = {
              [lambdaPermissionLogicalId]: JSON.parse(permissionTemplate),
            };

            _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Resources,
              newCloudWatchEventRuleObject, newPermissionObject);
          }
        });
      }
    });
  }

  formatInputTransformer(inputTransformer) {
    if (!inputTransformer.inputTemplate) {
      throw new this.serverless.classes.Error(
        'The inputTemplate key is required when specifying an ' +
        'inputTransformer for a cloudwatchEvent event'
      );
    }
    const cfmOutput = {
      // InputTemplate is required
      InputTemplate: inputTransformer.inputTemplate,
    };
    // InputPathsMap is optional
    if (inputTransformer.inputPathsMap) {
      cfmOutput.InputPathsMap = inputTransformer.inputPathsMap;
    }
    return JSON.stringify(cfmOutput);
  }
}

module.exports = AwsCompileCloudWatchEventEvents;
