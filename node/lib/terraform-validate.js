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
                                         ['validate', '-json'] );
  if ( runProductData === undefined ) { return; }
  actionsCore.info('runProductData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');  
  if ( runProductInitData.exitCode !== 0 ) {
    // Anon-zero exit code at this pint means bad configuration code
    actionsCore.setFailed('Terraform validation failure');
    return;
  }
  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
    'valid': JSON.parse(runProductData['stdOut']).valid,
  };
// ------------------------------------
actionsCore.debug('End terraformValidate');
return returnData;
// ------------------------------------
}
// EOF