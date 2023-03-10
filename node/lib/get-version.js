// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const fs = require('node:fs') // Node's file system module
const path = require('node:path') // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit
// ------------------------------------
// Internal modules
// ------------------------------------
// None
// ------------------------------------
// ------------------------------------
module.exports = async function getVersion(
  argProductName,
  argConfigDirectory,
  argSetupFileName
) {
  actionsCore.debug('Start getVersion')
  // ------------------------------------
  // Locate the product version to install
  // ------------------------------------
  actionsCore.info('Locating ' + argProductName + ' version to install')
  if (argProductName === 'terraform') {
    // doc: https://developer.hashicorp.com/terraform/language/settings
    var versionRegex =
      /terraform\s{[\s|\S]+?required_version\s=\s["']{1}(.*)["']{1}[^}]+}/
  } else {
    actionsCore.setFailed('Unsupported product[' + argProductName + ']')
    return
  }
  actionsCore.debug('versionRegex[' + versionRegex + ']')
  // determine setup file
  var setupFile = path.format({
    dir: argConfigDirectory,
    base: argSetupFileName,
  })
  actionsCore.debug('setupFile[' + setupFile + ']')
  // read setup file
  try {
    var setupFileData = fs.readFileSync(setupFile, 'utf8')
  } catch (error) {
    actionsCore.setFailed('Unable to read setup file[' + setupFile + ']')
    return
  }
  actionsCore.debug('setupFileData[' + setupFileData + ']')
  // locate version declaration
  var setupFileDataMatched = setupFileData.match(versionRegex)
  var requiredVersion = setupFileDataMatched[1] // 0 is the entire match
  if (requiredVersion === null || requiredVersion === '') {
    actionsCore.warning(
      'Unable to locate ' +
        argProductName +
        ' version within setupFile[' +
        setupFile +
        '] using latest'
    )
    requiredVersion = 'latest'
  }
  actionsCore.info('requiredVersion[' + requiredVersion + ']')
  // ------------------------------------
  actionsCore.debug('End getVersion')
  return requiredVersion
  // ------------------------------------
}
// EOF
