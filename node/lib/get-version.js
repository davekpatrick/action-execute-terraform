// BOF
// ------------------------------------
// Node.js core modules
// ------------------------------------
const fs   = require('fs');        // Node's file system module
const os   = require('os');        // Node's operating system module
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const core              = require('@actions/core');          // Microsoft's actions toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// Internal modules
// ------------------------------------
module.exports = async function getVersion(setupDirectory, setupFileName) {
  core.debug('Start getVersion');
  // ------------------------------------
  // doc: https://developer.hashicorp.com/terraform/language/expressions/version-constraints
  //      https://www.npmjs.com/package/@hashicorp/js-releases
  // ------------------------------------
  var setupFile = path.format({
                            dir: setupDirectory,
                            base: setupFileName
                          });
  var versionRegex = /terraform.*{(?:\s)*required_version\s*=\s*["\'](.*)["\']/;
  core.info('setupFile[' + setupFile + ']');
  var requiredVersion = fs.readFile( setupFile, 'utf8', function (error, data) {
    // locate terraform required_version declaration
    if (error) {
      core.setFailed('Unable to read setup file');
      return;
    }
    console.log(data)
    var matchedData = data.match(versionRegex);
    core.Info('matchedData[' + matchedData[1] + ']');
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