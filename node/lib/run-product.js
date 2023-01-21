// BOF
// ------------------------------------
const packageConfig = require('../package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os = require('node:os'); // Node's operating system
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore       = require('@actions/core');          // Microsoft's actions toolkit
const actionsExec       = require('@actions/exec');          // Microsoft's actions exec toolkit
// ------------------------------------
// ------------------------------------
module.exports = async function runProduct(argPathToBinary, argRunDirectory, argRunArguments) {
  actionsCore.debug('Start runProduct');
  // Create listeners to receive output (in memory) 
  let actionsExecStdOut = '';
  let actionSExecStdErr = '';
  const options = {};
  options.listeners = {
    stdout: (data) => {
      actionsExecStdOut += data.toString();
    },
    stderr: (data) => {
      actionSExecStdErr += data.toString();
    }
  };
  options.silent = true;
  options.ignoreReturnCode = true;
  options.cwd = argRunDirectory;
  // Execute and capture output
  let actionExecExitCode = await actionsExec.exec(argPathToBinary, argRunArguments, options);
  returnData = {
    'stdOut': actionsExecStdOut,  
    'stdErr': actionSExecStdErr,
    'exitCode': actionExecExitCode
  };
  // ------------------------------------
  actionsCore.debug('End runProduct');
  return JSON.parse(returnData);
  // ------------------------------------
}
// EOF