// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const fs   = require('node:fs');   // Node's file system module
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core'); // Microsoft's actions toolkit
// ------------------------------------
// ------------------------------------
module.exports = async function getVersion(setupProduct, setupDirectory, setupFileName) {
  actionsCore.debug('Start getVersion');
  // ------------------------------------
  // Locate the Terraform version to install
  //
  // doc: 
  // ------------------------------------
  var setupFile = path.format({
                            dir: setupDirectory,
                            base: setupFileName
                          });
  var versionRegex = /terraform.*{(?:\s)*required_version\s*=\s*["\'](.*)["\']/;
  actionsCore.info('setupFile[' + setupFile + ']');
  try {
    var setupFileData = fs.readFileSync( setupFile, 'utf8' );
    actionsCore.debug('setupFileData[' + setupFileData + ']');
  } catch (error) {
    actionsCore.setFailed('Unable to read setup file');
    return;
  }
  // locate terraform required_version declaration
  var setupFileDataMatched = setupFileData.match(versionRegex);
  requiredVersion = setupFileDataMatched[1];
  if (requiredVersion === null || requiredVersion === '') {
    actionsCore.warning('Unable to locate required_version in setupFile[' + setupFile + '] using latest version');
    requiredVersion = 'latest';
  }
  actionsCore.info('requiredVersion[' + requiredVersion + ']');
  // ------------------------------------
  actionsCore.debug('End getVersion');
  return requiredVersion;
  // ------------------------------------
}
// EOF