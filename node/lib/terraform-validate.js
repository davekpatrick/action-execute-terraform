// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os   = require('node:os'); // Node's operating system
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core'); // Microsoft's actions toolkit core
// ------------------------------------
// Internal modules
// ------------------------------------
const runProduct = require('./run-product.js');
const { access } = require('node:fs');
// ------------------------------------
// ------------------------------------
module.exports = async function terraformValidate( argPathToBinary, 
                                                   argRunDirectory ) {
  actionsCore.debug('Start terraformValidate');
  // terraform init -backend=false
  actionsCore.info('Terraform initialization with no backend');
  let runProductInitData = await runProduct( argPathToBinary, 
                                             argRunDirectory, 
                                             ['init', '-backend=false'] );
  if ( runProductInitData === undefined ) { return; }
  actionsCore.debug('runProductInitData[' + JSON.stringify(runProductInitData) + ']');
  actionsCore.info('exitcode[' + runProductInitData.exitCode + ']');
  if ( runProductInitData.exitCode !== 0 ) {
    // Anon-zero exit code at this pint means:
    // 1: bad configuration code
    // 2: a general command execution failure
    actionsCore.info('stderr[' + runProductInitData.stdErr + ']');
    actionsCore.setFailed('Terraform init command execution failure');
    return;
  }
  // terraform validate -json
  var runProductData = await runProduct( argPathToBinary,
                                         argRunDirectory,
                                         ['validated', '-json'] );
  if ( runProductData === undefined ) { return; }
  actionsCore.info('runProductData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');
  if ( runProductData.exitCode !== 0 ) {
    // Terraform validate command execution failure
    // if we have stderr, then we have a general command execution failure
    if ( runProductData.stdErr.length > 0 ) {
      actionsCore.info('stderr[' + runProductData.stdErr + ']');
      actionsCore.setFailed('Terraform validate command execution failure');
      return;
    } 
    // Anon-zero exit code at this pint means bad configuration code
    // if we have stdout, then we have a valid JSON object
    let runProductDataValid = JSON.parse(runProductData.stdOut).valid
    if ( runProductDataValid === false ) {
      actionsCore.error('Failure! The Terraform configuration code is invalid');
      actionsCore.info('Errors[' + JSON.parse(runProductData.stdOut).error_count + ']');
      actionsCore.info('Warnings[' + JSON.parse(runProductData.stdOut).warning_count + ']');
    }
  } else {
    // zero exit code means we have valid configuration code
    actionsCore.info('Success! The Terraform configuration code is valid');
  }
  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
    'valid': JSON.parse(runProductData.stdOut).valid,
    'version': JSON.parse(runProductData['stdOut']).format_version,
  };
// ------------------------------------
actionsCore.debug('End terraformValidate');
return returnData;
// ------------------------------------
}
// EOF