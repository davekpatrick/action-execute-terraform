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
// Internal modules
// ------------------------------------
// None
// ------------------------------------
// ------------------------------------
module.exports = async function setVersion( argProductName, 
                                            argConfigDirectory, 
                                            argSetupFileName,
                                            argSetupVersion ) {
  actionsCore.debug('Start setVersion');
  // ------------------------------------
  // Locate the product version to install
  // ------------------------------------
  actionsCore.info('Set ' + argProductName + ' version');
  if ( argProductName === 'terraform' ) {                   
    // doc: https://developer.hashicorp.com/terraform/language/settings    
    var versionRegex = /(terraform\s{[\s|\S]+?required_version\s=\s["']{1})(.*)(["']{1}[^}]+})/;
  } else {
    actionsCore.setFailed('Unsupported product[' + argProductName + ']');
    return;
  }
  actionsCore.debug('versionRegex[' + versionRegex + ']');
  // determine setup file
  var setupFile = path.format({
    dir: argConfigDirectory,
    base: argSetupFileName
  });
  actionsCore.debug('setupFile[' + setupFile + ']');
  // read setup file
  try {
    var setupFileData = fs.readFileSync( setupFile, 'utf8' );
  } catch (error) {
    actionsCore.setFailed('Unable to read setup file[' + setupFile + ']');
    return;
  }
  actionsCore.debug('setupFileData[' + setupFileData + ']');
  // locate version declaration
  var setupFileDataReplaced = setupFileData.replace(versionRegex, '$1' + argSetupVersion + '$3');
  try {
    fs.writeFileSync(setupFile, setupFileDataReplaced, { encoding: 'utf8' } ) 
  } catch (error) {
    actionsCore.setFailed('Unable to write setup file[' + setupFile + ']' + error);
    return;
  }
  actionsCore.info('setupFileDataReplaced[' + setupFileDataReplaced + ']');
  // ------------------------------------
  actionsCore.debug('End setVersion');
  return requiredVersion;
  // ------------------------------------
}
// EOF