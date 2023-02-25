// BOF
// ------------------------------------
const packageName = '@@NPM_PACKAGE_NAME@@'
const packageVersion = '@@NPM_PACKAGE_VERSION@@'
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
//
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit core
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion = require('./lib/get-version')
const setVersion = require('./lib/set-version')
const setupProduct = require('./lib/setup-product')
const runProduct = require('./lib/run-product')
const gitCommit = require('./lib/git-commit')
//
const runTerraformFmt = require('./lib/terraform-fmt')
const runTerraformValidate = require('./lib/terraform-validate')
const runTerraformInit = require('./lib/terraform-init')
const runTerraformPlan = require('./lib/terraform-plan')
const runTerraformApply = require('./lib/terraform-apply')
// ------------------------------------
// Main
// ------------------------------------
;(async () => {
  try {
    const productName = 'terraform'
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Initialize')
    actionsCore.info(
      'package[' + packageName + ']' + ' version[' + packageVersion + ']'
    )
    // NOTE: inputs and outputs are defined in action.yml metadata file
    const argApiToken = actionsCore.getInput('apiToken')
    const envApiToken = process.env.GITHUB_TOKEN // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_process_env
    // Ensure we have a usable API token
    var apiToken = null
    if (argApiToken !== null && argApiToken !== '') {
      actionsCore.debug('API token input provided')
      apiToken = argApiToken
    } else if (envApiToken !== null && envApiToken !== '') {
      actionsCore.debug('Environment API token found')
      apiToken = envApiToken
    } else {
      actionsCore.setFailed('No API token found')
      apiToken = null
    }
    actionsCore.setSecret(apiToken) // ensure we do not log sensitive data
    // Locate the version to install
    const argSetupVersion = actionsCore.getInput('setupVersion')
    100
    // pre-release version inclusion
    const argIncludePrerelease = actionsCore.getInput('includePrerelease')
    var includePrerelease = argIncludePrerelease === 'true' ? true : false
    // Invalid version handling
    const argVersionInvalidHandling = actionsCore.getInput(
      'versionInvalidHandling'
    )
    var versionInvalidHandling =
      argVersionInvalidHandling === 'fail' ? 'fail' : 'latest'
    // Use the HashiCorp Checkpoint service
    // src: https://github.com/hashicorp/go-checkpoint
    const argUseCheckPointService = actionsCore.getInput('useCheckPointService')
    var useCheckPointService = argUseCheckPointService === 'true' ? true : false
    if (useCheckPointService === false) {
      actionsCore.info('Disabling HashiCorp Checkpoint service')
      actionsCore.exportVariable('CHECKPOINT_DISABLE', 1)
    } else {
      actionsCore.debug('HashiCorp Checkpoint service enabled')
    }
    // Ensure we have a usable working directory
    const argConfigDirectory = actionsCore.getInput('configDirectory')
    if (argConfigDirectory !== null) {
      var configDirectory = argConfigDirectory
    }
    actionsCore.info('configDirectory[' + configDirectory + ']')
    // Ensure we have a usable setup file
    const argConfigFileName = actionsCore.getInput('configFileName')
    if (argConfigFileName !== null && argConfigFileName !== '') {
      var configFileName = argConfigFileName
    } else {
      actionsCore.setFailed('No setup file input specified')
    }
    actionsCore.debug('configFileName[' + configFileName + ']')
    // Terraform fmt options
    const argTerraformFmtType = actionsCore.getInput('terraformFmtType')
    if (argTerraformFmtType !== null && argTerraformFmtType !== '') {
      var terraformFmtType = argTerraformFmtType
    } else {
      actionsCore.setFailed('No terraformFmtType input specified')
    }
    actionsCore.debug('terraformFmtType[' + terraformFmtType + ']')
    // Terraform fmt commit message
    const argTerraformFmtCommitMessage = actionsCore.getInput(
      'terraformFmtCommitMessage'
    )
    if (
      argTerraformFmtCommitMessage !== null &&
      argTerraformFmtCommitMessage !== ''
    ) {
      var terraformFmtCommitMessage = argTerraformFmtCommitMessage
    } else {
      actionsCore.setFailed('No terraformFmtCommitMessage input specified')
    }
    // Terraform validate
    const argTerraformValidate = actionsCore.getInput('terraformValidate')
    var terraformValidate = argTerraformValidate === 'true' ? true : false

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Determine the ' + productName + ' version to setup')
    if (argSetupVersion !== null && argSetupVersion !== '') {
      var requiredVersion = argSetupVersion
      actionsCore.info('requiredVersion[' + requiredVersion + ']')
    } else {
      var getVersionData = await getVersion(
        productName,
        configDirectory,
        configFileName
      )
      if (getVersionData === undefined) {
        return
      }
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Download and setup ' + productName)
    // Download and setup the product
    let userAgent = packageName + '/' + packageVersion
    var setupConfig = await setupProduct(
      productName,
      getVersionData,
      versionInvalidHandling,
      includePrerelease,
      userAgent
    )
    if (setupConfig === undefined) {
      return
    }
    actionsCore.debug('setupConfig[' + JSON.stringify(setupConfig) + ']')
    actionsCore.info('setupVersion[' + setupConfig['version'] + ']')
    actionsCore.info('filePath[' + setupConfig['filePath'] + ']')
    // replace the version in source file
    actionsCore.info(
      'requestedVersionValid[' + setupConfig['requestedVersionValid'] + ']'
    )
    if (setupConfig['requestedVersionValid'] !== true) {
      actionsCore.warning(
        'Replacing requiredVersion[' +
          requiredVersion +
          '] with setupVersion[' +
          setupConfig['version'] +
          ']'
      )
      await setVersion(
        productName,
        configDirectory,
        configFileName,
        setupConfig['version']
      )
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup('Validate ' + productName + ' binary')
    // Execute a version test
    let runArguments = ['version', '-json']
    var runProductData = await runProduct(
      setupConfig['filePath'],
      configDirectory,
      runArguments
    )
    if (runProductData === undefined) {
      return
    }
    actionsCore.debug('returnData[' + JSON.stringify(runProductData) + ']')
    if (runProductData.exitCode !== 0) {
      actionsCore.setFailed('Binary version validation failed')
    }
    actionsCore.info('exitcode[' + runProductData.exitCode + ']')
    // ensure we have the version we expect
    var runProductStdOut = JSON.parse(runProductData.stdOut)
    if (runProductStdOut.terraform_version !== setupConfig['version']) {
      actionsCore.setFailed('Binary version does not match requested version')
    }
    // ensure we running a supported version
    if (runProductStdOut.terraform_outdated === true) {
      actionsCore.warning(
        'The ' +
          productName +
          ' version[' +
          runProductStdOut.terraform_version +
          '] being used is outdated'
      )
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' format')
    if (terraformFmtType !== 'none') {
      var terraformFmtData = await runTerraformFmt(
        setupConfig['filePath'],
        configDirectory,
        terraformFmtType
      )
      if (terraformFmtData === undefined) {
        return
      }
      actionsCore.debug('returnData[' + JSON.stringify(terraformFmtData) + ']')
      // determine if we need create a commit
      if (terraformFmtData.valid === false && terraformFmtType === 'write') {
        actionsCore.info('Updating repository with format updates')
        let actionDetails = packageName + '@' + packageVersion
        var gitCommitData = await gitCommit(
          apiToken,
          actionDetails,
          terraformFmtCommitMessage,
          terraformFmtData.invalidFiles
        )
        if (gitCommitData === undefined) {
          return
        }
        actionsCore.debug('returnData[' + JSON.stringify(gitCommitData) + ']')
      }
    } else {
      actionsCore.info('Skipping ' + productName + ' format')
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' validate')
    if (terraformValidate === true) {
      var terraformValidateData = await runTerraformValidate(
        setupConfig['filePath'],
        configDirectory
      )
      if (terraformValidateData === undefined) {
        return
      }
      actionsCore.debug(
        'returnData[' + JSON.stringify(terraformValidateData) + ']'
      )
    } else {
      actionsCore.info('Skipping ' + productName + ' validate')
    }
    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' init')
    var terraformInitData = await runTerraformInit(
      setupConfig['filePath'],
      configDirectory
    )
    if (terraformInitData === undefined) {
      return
    }
    actionsCore.debug('returnData[' + JSON.stringify(terraformInitData) + ']')

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' plan')
    var terraformPlanData = await runTerraformPlan(
      setupConfig['filePath'],
      configDirectory,
      'apply'
    )
    if (terraformPlanData === undefined) {
      return
    }
    actionsCore.info('returnData[' + JSON.stringify(terraformPlanData) + ']')

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' apply')
    var terraformApplyData = await runTerraformApply(
      setupConfig['filePath'],
      configDirectory
    )
    if (terraformApplyData === undefined) {
      return
    }
    actionsCore.info('returnData[' + JSON.stringify(terraformApplyData) + ']')

    actionsCore.endGroup()
    // ------------------------------------
    // ------------------------------------
    actionsCore.startGroup(productName + ' destroy')
    var terraformDestroyData = await runTerraformApply(
      setupConfig['filePath'],
      configDirectory,
      'destroy'
    )
    if (terraformDestroyData === undefined) {
      return
    }
    actionsCore.info('returnData[' + JSON.stringify(terraformDestroyData) + ']')

    actionsCore.endGroup()
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    actionsCore.setFailed(error.message)
  }
})()
// EOF
