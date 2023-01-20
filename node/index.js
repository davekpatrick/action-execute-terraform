// BOF
// ------------------------------------
const packageConfig = require('../package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------

// ------------------------------------
// External modules
// ------------------------------------
const actionsCore       = require('@actions/core');          // Microsoft's actions toolkit
const github            = require('@actions/github');        // Microsoft's actions github toolkit
const actionsIo         = require('@actions/io');            // Microsoft's actions io toolkit
const actionsExec       = require('@actions/exec');          // Microsoft's actions exec toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion     = require('./lib/get-version');
const setupTerraform = require('./lib/setup-terraform');
// ------------------------------------
// Main
// ------------------------------------
( async () => {
  try {
  const productName = 'terraform';
  actionsCore.info('package[' + packageConfig.name + ']' + ' version[' + packageConfig.version + ']');
  // NOTE: inputs and outputs are defined in action.yml metadata file
  const argApiToken  = actionsCore.getInput('apiToken');
  const envApiToken  = process.env.GITHUB_TOKEN;  // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env
  // Ensure we have a usable API token
  if ( argApiToken !== null && argApiToken !== '' ) {
    actionsCore.debug('API token input provided');
    var apiToken = argApiToken;
  } else if ( envApiToken !== null && envApiToken !== '' ) {
    actionsCore.debug('Environment API token found');
    var apiToken = envApiToken;
  } else {
    actionsCore.setFailed('No API token found');
    var apiToken = null;
  }
  actionsCore.setSecret(apiToken); // ensure we don't log the token
  // Ensure we have a usable working directory
  const argSetupDirectory = actionsCore.getInput('setupDirectory');
  if ( argSetupDirectory !== null && argSetupDirectory !== '' ) {
    var setupDirectory = argSetupDirectory;
  } else {
    var setupDirectory = process.env.GITHUB_WORKSPACE; // doc: https://docs.github.com/en/actions/reference/environment-variables
  }
  actionsCore.debug('setupDirectory[' + setupDirectory + ']');
  // Ensure we have a usable setup file
  const argSetupFileName = actionsCore.getInput('setupFileName');
  if ( argSetupFileName !== null && argSetupFileName !== '' ) {
    var setupFileName = argSetupFileName;
  } else {
    actionsCore.setFailed('No setup file input specified');
  }
  actionsCore.debug('setupFileName[' + setupFileName + ']');
  // Locate the Terraform version to install
  const argSetupVersion = actionsCore.getInput('setupVersion');
  if ( argSetupVersion !== null && argSetupVersion !== '' ) {
    var setupVersion = argSetupVersion;
  } else {
    var setupVersion = await getVersion(productName, setupDirectory, setupFileName);
  }
  actionsCore.setOutput("setupVersion", `${setupVersion}`);
  // Download and setup the Terraform binary
  var setupProduct = await setupTerraform(productName, setupDirectory, setupVersion);
  actionsCore.info('setupProduct[' + JSON.stringify(setupProduct) + ']')
  // Export environment variable
  actionsCore.exportVariable('TF_CLI_PATH', setupProduct['dirPath']);
  actionsCore.addPath(setupProduct['dirPath']);
  // validate the binary is available
  var pathToBinary = await actionsIo.which(setupProduct['filePath'], true);
  // Create listeners to receive output (in memory) as well
  let myOutput = '';
  let myError = '';
  let args = ['version'];
  const options = {};
  options.listeners = {
    stdout: (data) => {
      myOutput += data.toString();
    },
    stderr: (data) => {
      myError += data.toString();
    }
  };
  options.cwd = setupProduct['dirPath'];
  // Execute and capture output
  const exitCode = await exec(pathToBinary, args, options);
  actionsCore.info(`stdout: ${stdout.contents}`);
  actionsCore.info(`stderr: ${stderr.contents}`);
  actionsCore.info(`exitcode: ${exitCode}`);



} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) pacakge to log a message and set exit code
  actionsCore.setFailed(error.message);
}
})();
// EOF