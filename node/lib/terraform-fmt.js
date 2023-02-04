// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os   = require('node:os'); // Node's operating system
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core'); // Microsoft's actions toolkit core
// ------------------------------------
// Internal modules
// ------------------------------------
const runProduct = require('./run-product.js');
// ------------------------------------
// ------------------------------------
module.exports = async function terraformFmt(argPathToBinary, argRunDirectory, argType) {
  actionsCore.debug('Start terraformFmt');
  actionsCore.info('Format type[' + argType + ']');
  // setup variables
  var outputSplitString = '\n';
  // Argument validation
  if ( argType === 'check' ) {
    var runArguments = ['fmt', '-check', '-list=true', '-recursive'];
  } else if ( argType === 'write' || argType === 'strict' ) {
    var runArguments = ['fmt', '-write=true', '-list=true', '-recursive'];
  }  else {
    actionsCore.setFailed('Invalid type [' + argType + ']');
    return;
  }
  // Execute and capture output
  var runProductData = await runProduct(argPathToBinary, argRunDirectory, runArguments);
  if ( runProductData === undefined ) { return; }
  actionsCore.debug('runProductData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');
  if ( runProductData.exitCode !== 0 && ( argType === 'write' || argType === 'strict' ) ) {
    // if we are these modes and have a non-zero exit code then ... a problem has occurred
    actionsCore.info('stderr[' + runProductData.stdErr + ']');
    actionsCore.setFailed('Terraform fmt command execution failure');
    return;
  }
  // Format output into a list, removing empty items
  var runProductDataFileList = runProductData.stdOut.replaceAll(os.EOL,outputSplitString).split(outputSplitString).filter(n => n);
  var numInvalidFiles = runProductDataFileList.length;
  // format error message handling
  if ( numInvalidFiles > 0 ) {
    if ( numInvalidFiles === 1 ) { var fileWord = 'file'; } else { var fileWord = 'files'; }
    // incorrect format message
    var incorrectFormatMessage = numInvalidFiles + ' incorrectly formatted Terraform configuration ' + fileWord + ' detected';
    if ( argType === 'strict' ) {
      // just info log it as we are going to setFailed later
      actionsCore.info(incorrectFormatMessage );
    } else {
      actionsCore.notice(incorrectFormatMessage);
    }
    var validFormat = false;  
    var invalidFiles = [];
    // log incorrectly formatted files
    for ( let i = 0; i < numInvalidFiles; i++ ) {
      if ( runProductDataFileList[i] !== '' ) { 
        actionsCore.info('Invalid file[' + String(i).padStart(3, '0') + '][' + runProductDataFileList[i] + ']');
        // add to invalidFiles array
        invalidFiles.push(
          argRunDirectory + path.sep + runProductDataFileList[i]
        );
      }
    }
    // fail if strict
    if ( argType === 'strict' ) {
      actionsCore.setFailed('Terraform configuration file format issues must be corrected');
      return; 
    }
  } else {
    actionsCore.info('Correctly formatted Terraform configuration')
    var validFormat = true;
    var numInvalidFiles = 0;
  }
  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
    'validFormat': validFormat,
    'numInvalidFiles': numInvalidFiles,
    'invalidFiles': invalidFiles,
  };
  // ------------------------------------
  actionsCore.debug('End terraformFmt');
  return returnData;
  // ------------------------------------
}
// EOF