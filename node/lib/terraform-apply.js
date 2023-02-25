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
module.exports = async function terraformApply(
  argPathToBinary,
  argRunDirectory,
  argType = 'apply',
  argWithPlan = false
) {
  const functionName = terraformApply.name
  actionsCore.debug('Start ' + functionName)

  actionsCore.info('type[' + argType + ']')
  // Argument validation
  var runArguments = []
  if (argType.toLowerCase() === 'apply') {
    // terraform apply -auto-approve -input=false -json
    runArguments = ['apply', '-auto-approve', '-input=false', '-json']
  } else if (argType.toLowerCase() === 'destroy') {
    // terraform apply -auto-approve -input=false -json
    runArguments = [
      'apply',
      '-destroy',
      '-auto-approve',
      '-input=false',
      '-json',
    ]
  } else {
    actionsCore.setFailed('Invalid type [' + argType + ']')
    return
  }
  // ------------------------------------
  // ------------------------------------
  // If we have a plan file, then we use it
  if (argWithPlan === true) {
    runArguments.push('default.tfplan')
  }

  actionsCore.info('Terraform ' + argType)
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
  if (runProductData.exitCode !== 0) {
    // if we have stderr, then we have a general command execution failure
    if (runProductData.stdErr.length > 0) {
      actionsCore.info('stderr[' + runProductData.stdErr + ']')
      actionsCore.setFailed('Terraform command execution failure')
      return
    }
  } else {
    // zero exit code means we have a successful execution
    actionsCore.info('The Terraform ' + argType + ' completed successfully')
  }
  // setup return data
  let returnData = {
    stdOut: runProductData['stdOut'],
    stdErr: runProductData['stdErr'],
    exitCode: runProductData['exitCode'],
  }
  // ------------------------------------
  actionsCore.debug('End ' + functionName)
  return returnData
  // ------------------------------------
}
// EOF
