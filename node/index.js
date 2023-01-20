// BOF
// ------------------------------------
const packageData = require('./package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------

// ------------------------------------
// External modules
// ------------------------------------
const core              = require('@actions/core');          // Microsoft's actions toolkit
const github            = require('@actions/github');        // Microsoft's actions github toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion     = require('./lib/get-version');
const setupTerraform = require('./lib/setup-terraform');
// ------------------------------------
// Main
// ------------------------------------
try {
  const productName = 'terraform';
  core.info('package[' + packageData.name + ']' + ' version[' + packageData.version + ']');
  // NOTE: inputs and outputs are defined in action.yml metadata file
  const argApiToken  = core.getInput('apiToken');
  const envApiToken  = process.env.GITHUB_TOKEN;  // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env
  // Ensure we have a usable API token
  if ( argApiToken !== null && argApiToken !== '' ) {
    core.debug('API token input provided');
    var apiToken = argApiToken;
  } else if ( envApiToken !== null && envApiToken !== '' ) {
    core.debug('Environment API token found');
    var apiToken = envApiToken;
  } else {
    core.setFailed('No API token found');
    var apiToken = null;
  }
  core.setSecret(apiToken); // ensure we don't log the token
  // Ensure we have a usable working directory
  const argSetupDirectory = core.getInput('setupDirectory');
  if ( argSetupDirectory !== null && argSetupDirectory !== '' ) {
    var setupDirectory = argSetupDirectory;
  } else {
    var setupDirectory = process.env.GITHUB_WORKSPACE; // doc: https://docs.github.com/en/actions/reference/environment-variables
  }
  core.debug('setupDirectory[' + setupDirectory + ']');
  // Ensure we have a usable setup file
  const argSetupFileName = core.getInput('setupFileName');
  if ( argSetupFileName !== null && argSetupFileName !== '' ) {
    var setupFileName = argSetupFileName;
  } else {
    core.setFailed('No setup file input specified');
  }
  core.debug('setupFileName[' + setupFileName + ']');
  // Locate the Terraform version to install
  const argSetupVersion = core.getInput('setupVersion');
  if ( argSetupVersion !== null && argSetupVersion !== '' ) {
    var setupVersion = argSetupVersion;
  } else {
    var setupVersion = getVersion(productName, setupDirectory, setupFileName);
  }
  // Download metadata for a release using a semver range or "latest"
  let userAgent = packageData.name + '/' + packageData.version;
  let releaseData = await hashicorpReleases.getRelease(setupProduct, requiredVersion, userAgent);
  core.debug('releaseData[' + JSON.stringify(releaseData) + ']');
  var releaseVersion = releaseData.version;
  // Download and setup the Terraform binary
  var setupVersion = setupTerraform(releaseVersion);
  core.info('setupVersion[' + setupVersion + ']')
  core.setOutput("setupVersion", `${setupVersion}`);




} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) pacakge to log a message and set exit code
  core.setFailed(error.message);
}
// EOF