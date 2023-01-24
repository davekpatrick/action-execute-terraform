// BOF
// terraform fmt -check -write=false -diff=true -recursive
// terraform fmt -write=false -diff=false -list=true -recursive
// terraform fmt -write=true -diff=false -list=true -recursive
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
module.exports = async function terraformFmt(argPathToBinary, argRunDirectory) {
  actionsCore.debug('Start terraformFmt');
  actionsCore.info('Rewrite Terraform configuration files to a canonical format and style')
  // Argument validation
  actionsCore.info('processEnv[' + JSON.stringify(process.env) + ']');
  let runArguments = ['fmt', '-check', '-list=true', '-recursive'];
  // Execute and capture output
  var runProductData = await runProduct(argPathToBinary, argRunDirectory, runArguments);
  actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + returnData.exitCode + ']');
  if ( returnData.exitCode !== 0 ) {
    actionsCore.setFailed('fmt failed');
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