// BOF
// ------------------------------------
// Node.js core modules
// ------------------------------------
const fs = require('fs');   // Node's file system module
// ------------------------------------
// External modules
// ------------------------------------
const core              = require('@actions/core');          // Microsoft's actions toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
const { version } = require('os');
// ------------------------------------
//
// ------------------------------------
module.exports = async function getVersion(setupDirectory, setupFileName) {
  core.debug('Start getVersion');
  // ------------------------------------
  // doc: https://developer.hashicorp.com/terraform/language/expressions/version-constraints
  //      https://www.npmjs.com/package/@hashicorp/js-releases
  // ------------------------------------
  var setupFile = setupDirectory + '/' + setupFileName;
  var versionRegex = /terraform.*{(?:\s)*required_version\s*=\s*["\'](.*)["\']/;
  core.debug('setupFile[' + setupFile + ']');
  var requiredVersion = fs.readFile( setupFile, 'utf8', function (error, data) {
    // locate terraform required_version declaration
    if (error) {
      core.setFailed('Unable to read setup file');
      return;
    }
    var matchedData = data.match(versionRegex);
    return matchedData[1];
  } );
  if (requiredVersion === null || requiredVersion === '') {
    core.Info('Unable to locate required_version in setupFile[' + setupFile + '] using latest version');
    version = 'latest';
  } else {
    version =  requiredVersion;
  }
  core.info('version[' + version + ']');
  // ------------------------------------
  core.debug('End getVersion');
  return version;
  // ------------------------------------
}
// EOF