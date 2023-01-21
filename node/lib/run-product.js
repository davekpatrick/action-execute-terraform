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
const actionsToolCache  = require('@actions/tool-cache');    // Microsoft's actions toolkit
// ------------------------------------
// ------------------------------------
module.exports = async function runProduct(argPathToBinary, argRunDirectory, argRunCommandArguments) {
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
  let actionExecExitCode = await actionsExec.exec(argPathToBinary, argRunCommandArguments, options);
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