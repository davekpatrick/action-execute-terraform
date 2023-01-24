// BOF
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core');          // Microsoft's actions toolkit
const actionsExec = require('@actions/exec');          // Microsoft's actions exec toolkit
// ------------------------------------
// ------------------------------------
module.exports = async function runProduct(argPathToBinary, argRunDirectory, argRunArguments) {
  actionsCore.debug('Start runProduct');
  // Argument validation
  if ( argPathToBinary === null || argPathToBinary === '' ) {
    actionsCore.setFailed('No path to binary provided');
    return;
  }
  if ( argRunDirectory === null || argRunDirectory === '' ) {
    actionsCore.setFailed('No working directory provided');
    return;
  }
  // Create listeners to receive output (in memory) 
  let actionsExecStdOut = '';
  let actionSExecStdErr = '';
  let actionsExecOptions = {};
  actionsExecOptions.listeners = {
    stdout: (data) => {
      actionsExecStdOut += data.toString();
    },
    stderr: (data) => {
      actionSExecStdErr += data.toString();
    }
  };
  actionsExecOptions.silent = true;
  actionsExecOptions.ignoreReturnCode = true;
  actionsExecOptions.cwd = argRunDirectory;
  // Execute and capture output
  actionsCore.debug('processEnv[' + JSON.stringify(process.env) + ']');
  let actionExecExitCode = await actionsExec.exec(argPathToBinary, argRunArguments, actionsExecOptions);
  returnData = {
    'stdOut': actionsExecStdOut,  
    'stdErr': actionSExecStdErr,
    'exitCode': actionExecExitCode
  };
  // ------------------------------------
  actionsCore.debug('End runProduct');
  return returnData;
  // ------------------------------------
}
// EOF