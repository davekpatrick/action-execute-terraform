// BOF
// terraform fmt -check -write=false -diff=true -recursive
// terraform fmt -write=false -diff=false -list=true -recursive
// terraform fmt -write=true -diff=false -list=true -recursive
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
  actionsCore.info('Rewrite Terraform configuration files to a canonical format and style')
  // Argument validation
  if ( argType === 'check' ) {
    var runArguments = ['fmt', '-check', '-list=true', '-recursive'];
  } else if ( argType === 'write' ) {
    var runArguments = ['fmt', '-write=true', '-list=true', '-recursive'];
  } else {
    actionsCore.setFailed('Invalid type [' + argType + ']');
    return;
  }
  // Execute and capture output
  var runProductData = await runProduct(argPathToBinary, argRunDirectory, runArguments);
  actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + returnData.exitCode + ']');
  if ( returnData.exitCode !== 0 ) {
    actionsCore.warning('Invalid Terraform configuration file format detected');
    let fileList = returnData.stdOut.split(os.EOL);
    for ( let i = 0; i < fileList.length; i++ ) {
      if ( fileList[i] !== '' ) { 
        actionsCore.info('file[' + fileList[i] + ']');
      }
    }
    //
    actionsCore.setFailed('Terraform fmt failure');
    return;
  }
  // 
  
  
  
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
  };
  // ------------------------------------
  actionsCore.debug('End terraformFmt');
  return returnData;
  // ------------------------------------
}
// EOF
// EOF