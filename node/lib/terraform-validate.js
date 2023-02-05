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
  actionsCore.info('runProductInitData[' + JSON.stringify(runProductInitData) + ']');
  actionsCore.info('exitcode[' + runProductInitData.exitCode + ']');
  // terraform validate -json
  var runProductData = await runProduct( argPathToBinary,
                                         argRunDirectory,
                                         ['validate', '-json'] );
  if ( runProductData === undefined ) { return; }
  actionsCore.info('runProductData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');  

  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
    'valid': runProductData['stdOut'].JSON.parse().valid,
  };
// ------------------------------------
actionsCore.debug('End terraformValidate');
return returnData;
// ------------------------------------
}
// EOF