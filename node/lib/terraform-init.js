// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
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
module.exports = async function terraformInit( argPathToBinary, 
                                               argRunDirectory ) {
  actionsCore.debug('Start terraformInit');
 // terraform init
 actionsCore.info('Terraform initialization');
 let runProductData = await runProduct( argPathToBinary, 
                                        argRunDirectory, 
                                        ['init'] );
 if ( runProductData === undefined ) { return; }
 actionsCore.debug('runProductData[' + JSON.stringify(runProductData) + ']');
 actionsCore.info('exitcode[' + runProductData.exitCode + ']');
 if ( runProductData.exitCode !== 0 ) {
   // Anon-zero exit code at this pint means:
   // 1: backend initialization failure
   // 2: provider setup failure
   // 3: a general command execution failure
   actionsCore.info('stderr[' + runProductData.stdErr + ']');
   actionsCore.setFailed('Terraform init failure');
   return;
 }



  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
  };
  // ------------------------------------
  actionsCore.debug('End terraformInit');
  return returnData;
  // ------------------------------------
}
// EOF