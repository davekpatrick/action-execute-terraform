// BOF
// ------------------------------------
const packageConfig = require('../package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
//
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core');    // Microsoft's actions toolkit core
const github      = require('@actions/github');  // Microsoft's actions github
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion     = require('./lib/get-version');
const setupProduct   = require('./lib/setup-product');
const runProduct     = require('./lib/run-product');
const terraformFmt   = require('./lib/terraform-fmt');
// ------------------------------------
// Main
// ------------------------------------
( async () => {
  try {
  const productName = 'terraform';
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Initialize')
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
  actionsCore.setSecret(apiToken); // ensure we do not log sensitive data
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
  // Locate the version to install
  const argSetupVersion = actionsCore.getInput('setupVersion');
  // Use the HashiCorp Checkpoint service
  // src: https://github.com/hashicorp/go-checkpoint
  const argUseCheckPointService = actionsCore.getInput('useCheckPointService');
  var useCheckPointService = ( argUseCheckPointService === 'true' ) ? true : false;
  if ( useCheckPointService === false ) {
    actionsCore.info('Disabling HashiCorp Checkpoint service');
    actionsCore.exportVariable('CHECKPOINT_DISABLE', 1);
  } else {  
    actionsCore.debug('HashiCorp Checkpoint service enabled');
  }
  actionsCore.endGroup();
  // Terraform fmt options
  const argTerraformFmtType = actionsCore.getInput('terraformFmtType');
  if ( argTerraformFmtType !== null && argTerraformFmtType !== '' ) {
    var terraformFmtType = argTerraformFmtType;
  } else {
    actionsCore.setFailed('No terraformFmtType input specified')
  }
  actionsCore.debug('terraformFmtType[' + terraformFmtType + ']');
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Determine the ' + productName +' version to setup')
  if ( argSetupVersion !== null && argSetupVersion !== '' ) {
    var requiredVersion = argSetupVersion;
    actionsCore.info('requiredVersion[' + requiredVersion + ']')
  } else {
    try {
      var requiredVersion = await getVersion(productName, setupDirectory, setupFileName);
    } catch (error) {
      return;
    }
  }
  actionsCore.endGroup();
  actionsCore.startGroup('Download and setup ' + productName);
  // Download and setup the product
  try {
    var setupConfig = await setupProduct(productName, setupDirectory, requiredVersion);
  } catch (error) {
    return;
  }
  actionsCore.debug('setupConfig[' + JSON.stringify(setupConfig) + ']')
  actionsCore.info('setupVersion[' + setupConfig['version'] + ']')
  actionsCore.setOutput("setupVersion",setupConfig['version']);
  // Export environment variable
  actionsCore.setOutput("setupPath", setupConfig['dirPath']);
  actionsCore.exportVariable('TF_CLI_PATH', setupConfig['dirPath']);
  actionsCore.addPath(setupConfig['dirPath']);
  actionsCore.endGroup();
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Validate ' + productName + ' binary')
  // Execute a version test
  try {
    let runArguments = ['version', '-json'];
    var runProductData = await runProduct(setupConfig['filePath'], setupConfig['dirPath'], runArguments);
  } catch (error) {
    return;
  }
  actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']');
  if ( runProductData.exitCode !== 0 ) {
    actionsCore.setFailed('Binary version validation failed');
    return;
  }
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');
  // ensure we have the version we expect
  var runProductStdOut = JSON.parse(runProductData.stdOut);
  if ( runProductStdOut.terraform_version !== setupConfig['version'] ) {
    actionsCore.setFailed('Binary version does not match requested version');
    return;
  }
  // ensure we running a supported version
  if ( runProductStdOut.terraform_outdated === true ) {
    actionsCore.warning('The ' + productName + ' version[' + runProductStdOut.terraform_version + '] being used is outdated');
  }
  actionsCore.endGroup();
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup( productName + ' format' ); 
  if ( terraformFmtType !== 'none' ) {
    try {
      var terraformFmtData = await terraformFmt(setupConfig['filePath'], setupConfig['dirPath'], terraformFmtType);
    } catch (error) {
      return;
    }
    actionsCore.info('returnData[' + JSON.stringify(terraformFmtData) + ']');
    // determine if we need create a commit and PR
    if ( terraformFmtData.validFormat === false && terraformFmtType === 'write' ) {
      const context = github.context;
      const octokit = github.getOctokit(apiToken);
      // commit inputs
      const commitMessage = 'Terraform fmt';
      const commitBranch = context.ref;
      const commitAuthor = context.actor;
      const commitEmail = context.actor + '@users.noreply.github.com';
      const commitFiles = returnData.invalidFiles; 
      // commit options
      const commitOptions = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        message: commitMessage,
        branch: commitBranch,
      };
      if ( commitAuthor !== null && commitAuthor !== '' ) {
        commitOptions['author'] = commitAuthor;
      }
      if ( commitEmail !== null && commitEmail !== '' ) {
        commitOptions['email'] = commitEmail;
      }
      if ( commitFiles !== null && commitFiles !== '' ) { 
        commitOptions['files'] = commitFiles;
      }
      actionsCore.debug('commitOptions[' + JSON.stringify(commitOptions) + ']');
      // Create a commit
      const commitResponse = await octokit.repos.createCommit(commitOptions);
      actionsCore.debug('commitResponse[' + JSON.stringify(commitResponse) + ']');
      actionsCore.info('commitSha[' + commitResponse.data.sha + ']')
      // pull request options
      const pullRequestOptions = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: commitMessage,
        head: commitBranch,
        base: commitBranch,
      };
      actionsCore.debug('pullRequestOptions[' + JSON.stringify(pullRequestOptions) + ']');
      // Create a pull request
      const pullRequestResponse = await octokit.pulls.create(pullRequestOptions);
      actionsCore.debug('pullRequestResponse[' + JSON.stringify(pullRequestResponse) + ']');
      actionsCore.info('pullRequestNumber[' + pullRequestResponse.data.number + ']')
      //
      // Set the output
      //actionsCore.setOutput("pullRequestNumber", pullRequestResponse.data.number);
    }
  } else {
    actionsCore.info('Skipping ' + productName + ' format');
  }
  actionsCore.endGroup();
} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) package to log a message and set exit code
  actionsCore.setFailed(error.message);
}
})();
// EOF