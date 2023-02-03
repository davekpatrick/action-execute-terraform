// BOF
// ------------------------------------
const packageName    = '@@NPM_PACKAGE_NAME@@';
const packageVersion = '@@NPM_PACKAGE_VERSION@@';
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
const gitCommit      = require('./lib/git-commit');
// ------------------------------------
// Main
// ------------------------------------
( async () => {
  try {
  const productName = 'terraform';
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Initialize')
  actionsCore.info('package[' + packageName + ']' + ' version[' + packageVersion + ']');
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
  // Locate the version to install
  const argSetupVersion = actionsCore.getInput('setupVersion');
  // pre-release version inclusion 
  const argIncludePrerelease = actionsCore.getInput('includePrerelease');
  var includePrerelease = ( argIncludePrerelease === 'true' ) ? true : false;
  // Invalid version handling
  const argVersionInvalidHandling  = actionsCore.getInput('versionInvalidHandling');
  var versionInvalidHandling = ( argVersionInvalidHandling === 'fail' ) ? 'fail' : 'latest';
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
  // Terraform fmt options
  const argTerraformFmtType = actionsCore.getInput('terraformFmtType');
  if ( argTerraformFmtType !== null && argTerraformFmtType !== '' ) {
    var terraformFmtType = argTerraformFmtType;
  } else {
    actionsCore.setFailed('No terraformFmtType input specified')
  }
  actionsCore.debug('terraformFmtType[' + terraformFmtType + ']');
  actionsCore.endGroup();
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Determine the ' + productName +' version to setup')
  if ( argSetupVersion !== null && argSetupVersion !== '' ) {
    var requiredVersion = argSetupVersion;
    actionsCore.info('requiredVersion[' + requiredVersion + ']')
  } else {
    var requiredVersion = await getVersion( productName, 
                                            setupDirectory, 
                                            setupFileName );
    if ( requiredVersion === undefined ) { return; }
  }
  actionsCore.endGroup();
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Download and setup ' + productName);
  // Download and setup the product
  let userAgent = packageName + '/' + packageVersion;
  var setupConfig = await setupProduct( productName, 
                                        setupDirectory, 
                                        requiredVersion, 
                                        versionInvalidHandling, 
                                        includePrerelease, 
                                        userAgent );
  if ( setupConfig === undefined ) { return; }
  actionsCore.debug('setupConfig[' + JSON.stringify(setupConfig) + ']')
  actionsCore.info('setupVersion[' + setupConfig['version'] + ']')
  // Export variables
  actionsCore.setOutput("setupVersion",setupConfig['version']);
  actionsCore.setOutput("setupPath", setupConfig['dirPath']);
  actionsCore.exportVariable('TF_CLI_PATH', setupConfig['dirPath']);
  actionsCore.addPath(setupConfig['dirPath']);
  actionsCore.endGroup();
  // ------------------------------------
  // ------------------------------------
  actionsCore.startGroup('Validate ' + productName + ' binary')
  // Execute a version test
  let runArguments = ['version', '-json'];
  var runProductData = await runProduct( setupConfig['filePath'], 
                                         setupConfig['dirPath'], 
                                         runArguments );
  if ( runProductData === undefined ) { return; }
  actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']');
  if ( runProductData.exitCode !== 0 ) {
    actionsCore.setFailed('Binary version validation failed');
  }
  actionsCore.info('exitcode[' + runProductData.exitCode + ']');
  // ensure we have the version we expect
  var runProductStdOut = JSON.parse(runProductData.stdOut);
  if ( runProductStdOut.terraform_version !== setupConfig['version'] ) {
    actionsCore.setFailed('Binary version does not match requested version');
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
    var terraformFmtData = await terraformFmt( setupConfig['filePath'],
                                               setupConfig['dirPath'], 
                                               terraformFmtType);
    if ( terraformFmtData === undefined ) { return; }
    actionsCore.debug('returnData[' + JSON.stringify(terraformFmtData) + ']');
    // determine if we need create a commit
    if ( terraformFmtData.validFormat === false && terraformFmtType === 'write' ) {
      actionsCore.info('Updating repository with format updates');
      let actionDetails = packageName + '@' + packageVersion;
      var gitCommitData = await gitCommit( apiToken, 
                                           actionDetails,
                                           'Updating incorrectly formatted files',
                                           setupConfig['dirPath'], 
                                           terraformFmtData.invalidFiles );
      if ( gitCommitData === undefined ) { return; }
      actionsCore.info('returnData[' + JSON.stringify(gitCommitData) + ']');
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