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
    // Anon-zero exit code at this pint means bad configuration code
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
  var runProductInitDataValid = JSON.parse(runProductData['stdOut']).valid
  if ( runProductInitData.exitCode !== 0 || runProductInitDataValid === false ) {
    // Anon-zero exit code at this pint means bad configuration code
    actionsCore.error('Failure! The Terraform configuration code is invalid');
    if ( runProductInitDataValid === false ) {
      actionsCore.info('Errors[' + JSON.parse(runProductData['stdOut']).error_count + ']');
      actionsCore.info('Warnings[' + JSON.parse(runProductData['stdOut']).warning_count + ']');
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
    'valid': runProductInitDataValid,
    'version': JSON.parse(runProductData['stdOut']).format_version,
  };
// ------------------------------------
actionsCore.debug('End terraformValidate');
return returnData;
// ------------------------------------
}
// EOF