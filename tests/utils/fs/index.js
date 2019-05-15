const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function getTmpDirPath() {
  return path.join(os.tmpdir(),
      'tmpdirs-serverless', 'serverless', crypto.randomBytes(8).toString('hex'));
}

function getTmpFilePath(fileName) {
  return path.join(getTmpDirPath(), fileName);
}

function replaceTextInFile(filePath, subString, newSubString) {
  const fileContent = fs.readFileSync(filePath).toString();
  fs.writeFileSync(filePath, fileContent.replace(subString, newSubString));
}

module.exports = {
  getTmpDirPath,
  getTmpFilePath,
  replaceTextInFile,
};
