// BOF
// ------------------------------------
const package = require('../package.json');
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
module.exports = async function getVersion(setupProduct,setupDirectory, setupFileName) {
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
    requiredVersion = 'latest';
  }
  core.info('requiredVersion[' + requiredVersion + ']');
  // Download metadata for a release using a semver range or "latest"
  // "latest" is set by default if no range is included
  let userAgent = package.name + '/' + package.version;
  core.info('userAgent[' + userAgent + ']')
  var releaseData = await hashicorpReleases.getRelease(setupProduct, requiredVersion, userAgent);

  core.info('releaseData[' + JSON.stringify(releaseData) + ']');
  // ------------------------------------
  core.debug('End getVersion');
  return requiredVersion;
  // ------------------------------------
}
// EOF