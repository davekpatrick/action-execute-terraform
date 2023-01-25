// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os = require('node:os'); // Node's operating system
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core');          // Microsoft's actions toolkit
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
  actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + returnData.exitCode + ']');
  if ( returnData.exitCode !== 0 && ( argType === 'write' || argType === 'strict' ) ) {
    actionsCore.setFailed('Terraform fmt command execution failure');
    return;
  }
  // Format output into a list, removing empty items
  var returnDataFileList = returnData.stdOut.replaceAll(os.EOL,outputSplitString).split(outputSplitString).filter(n => n);
  // format error message handling
  if ( returnDataFileList.length > 0 ) {
    if ( returnDataFileList.length === 1 ) { var fileWord = 'file'; } else { var fileWord = 'files'; }
    // incorrect format message
    var incorrectFormatMessage = returnDataFileList.length + ' incorrectly formatted Terraform configuration ' + fileWord + ' detected';
    if ( argType === 'strict' ) {
      // just info log it as we are going to setFailed later
      actionsCore.info(incorrectFormatMessage );
    } else {
      actionsCore.notice(incorrectFormatMessage);
    }
    var validFormat = false;  
    var numInvalidFiles = returnDataFileList.length;
    // log any format issue files
    for ( let i = 0; i < returnDataFileList.length; i++ ) {
      if ( returnDataFileList[i] !== '' ) { 
        actionsCore.info('Invalid file[' + String(i).padStart(3, '0') + '][' + returnDataFileList[i] + ']');
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
  };
  // ------------------------------------
  actionsCore.debug('End terraformFmt');
  return returnData;
  // ------------------------------------
}
// EOF
// EOF