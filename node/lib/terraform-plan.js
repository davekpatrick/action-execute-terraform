// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
// None
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit core
// ------------------------------------
// Internal modules
// ------------------------------------
const runProduct = require('./run-product.js')
// ------------------------------------
// ------------------------------------
module.exports = async function terraformPlan(
  argPathToBinary,
  argRunDirectory,
  argType
) {
  actionsCore.debug('Start terraformPlan')
  //
  actionsCore.info('Terraform plan')
  actionsCore.info('type[' + argType + ']')
  // Argument validation
  var runArguments = []
  if (argType === 'apply') {
    runArguments = [
      'plan',
      '-input=false',
      '-detailed-exitcode',
      '-out=default.tfplan',
    ]
  } else if (argType === 'destroy') {
    runArguments = [
      'plan',
      '-destroy',
      '-input=false',
      '-detailed-exitcode',
      '-out=default.tfplan',
    ]
  } else {
    actionsCore.setFailed('Invalid type [' + argType + ']')
    return
  }
  var runProductData = await runProduct(
    argPathToBinary,
    argRunDirectory,
    runArguments
  )
  if (runProductData === undefined) {
    return
  }
  actionsCore.debug('runProductData[' + JSON.stringify(runProductData) + ']')
  actionsCore.info('exitcode[' + runProductData.exitCode + ']')
  if (runProductData.exitCode === 1) {
    // Note: -detailed-exitcode is used, so we can get a 1 exit code
    // if we have stderr, then we have a general command execution failure
    if (runProductData.stdErr.length > 0) {
      actionsCore.info('stderr[' + runProductData.stdErr + ']')
      actionsCore.setFailed('Terraform command execution failure')
      return
    }
  } else {
    // zero exit code means we have a successful execution
    actionsCore.info('The Terraform plan completed successfully')
  }
  // setup return data
  let returnData = {
    stdOut: runProductData['stdOut'],
    stdErr: runProductData['stdErr'],
    exitCode: runProductData['exitCode'],
  }
  // ------------------------------------
  actionsCore.debug('End terraformPlan')
  return returnData
  // ------------------------------------
}
// EOF
