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
module.exports = async function terraformDestroy( argPathToBinary, 
                                                  argRunDirectory,
                                                  argType ) {
  actionsCore.debug('Start terraformApply');
  actionsCore.info('type[' + argType + ']');
  // Argument validation
  if ( argType === 'noPlan' ) {
    var runArguments = ['apply', '-destroy', '-auto-approve', '-input=false', '-json'];
  } else if ( argType === 'plan' ) {
    var runArguments = ['apply', '-destroy', '-auto-approve', '-input=false', '-json', 'default.tfplan' ];
  }  else {
    actionsCore.setFailed('Invalid type [' + argType + ']');
    return;
  }
  
  actionsCore.info('Terraform apply');
  var runProductData = await runProduct( argPathToBinary,
                                         argRunDirectory,
                                         runArguments );
  if ( runProductData === undefined ) { return; }
  actionsCore.debug('runProductData[' + JSON.stringify(runProductData) + ']');
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');
  if ( runProductData.exitCode !== 0 ) {
    // if we have stderr, then we have a general command execution failure
    if ( runProductData.stdErr.length > 0 ) {
      actionsCore.info('stderr[' + runProductData.stdErr + ']');
      actionsCore.setFailed('Terraform command execution failure');
      return;
    } 
  } else {
    // zero exit code means we have a successful execution
    actionsCore.info('The Terraform destroy completed successfully');
  }
  // setup return data
  returnData = {
    'stdOut': runProductData['stdOut'],  
    'stdErr': runProductData['stdErr'],
    'exitCode': runProductData['exitCode'],
  };
  // ------------------------------------
  actionsCore.debug('End terraformApply');
  return returnData;
  // ------------------------------------
}
// EOF