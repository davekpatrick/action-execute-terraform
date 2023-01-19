// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core   = require('@actions/core');   // Microsoft's actions toolkit
const github = require('@actions/github'); // Microsoft's actions github toolkit
const semver = require('semver');          // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion     = require('./lib/get-version');
const setupTerraform = require('./lib/setup-terraform');
//
try {
  // NOTE: inputs and outputs are defined in action.yml metadata file
  const argApiToken  = core.getInput('apiToken');
  const envApiToken  = process.env.GITHUB_TOKEN;  // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html

  core.info(`process.env[${process.env}]`);

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
    var setupVersion = getVersion(setupDirectory, setupFileName);
  }


  
  core.setOutput("setupVersion", `${setupVersion}`);
  //





} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) pacakge to log a message and set exit code
  core.setFailed(error.message);
}
// EOF