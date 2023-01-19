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
  try {
    var setupFileData = fs.readFileSync( setupFile, 'utf8' );
    core.info('setupFileData[' + setupFileData + ']');
  } catch (error) {
    core.setFailed('Unable to read setup file');
    return;
  }
  // locate terraform required_version declaration
  var setupFileDataMatched = setupFileData.match(versionRegex);
  requiredVersion = setupFileDataMatched[1];
  if (requiredVersion === null || requiredVersion === '') {
    core.info('Unable to locate required_version in setupFile[' + setupFile + '] using latest version');
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