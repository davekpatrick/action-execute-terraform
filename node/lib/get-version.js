// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const fs   = require('node:fs');   // Node's file system module
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core'); // Microsoft's actions toolkit
// ------------------------------------
// Internal modules
// ------------------------------------
module.exports = async function getVersion(setupProduct, setupDirectory, setupFileName) {
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
    core.debug('setupFileData[' + setupFileData + ']');
  } catch (error) {
    core.setFailed('Unable to read setup file');
    return;
  }
  // locate terraform required_version declaration
  var setupFileDataMatched = setupFileData.match(versionRegex);
  requiredVersion = setupFileDataMatched[1];
  if (requiredVersion === null || requiredVersion === '') {
    core.warning('Unable to locate required_version in setupFile[' + setupFile + '] using latest version');
    requiredVersion = 'latest';
  }
  core.info('requiredVersion[' + requiredVersion + ']');
  // ------------------------------------
  core.debug('End getVersion');
  return requiredVersion;
  // ------------------------------------
}
// EOF