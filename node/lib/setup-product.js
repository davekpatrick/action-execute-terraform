// BOF
// ------------------------------------
const packageConfig = require('../package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os   = require('node:os'); // Node's operating system
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore       = require('@actions/core');          // Microsoft's actions toolkit
const actionsToolCache  = require('@actions/tool-cache');    // Microsoft's actions toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// ------------------------------------
function getOsArchitecture() {
  // doc: https://nodejs.org/api/os.html#os_os_arch
  let architecture = os.arch();
  let osArchitectures = {
    x32: '386',
    x64: 'amd64'
  }
  // ------------------------------------
  return osArchitectures[architecture] || architecture;
  // ------------------------------------
}
function getOsPlatform() {
  // doc: https://nodejs.org/api/os.html#os_os_platform
  let platform = os.platform();
  let osPlatformMap = {
    win32: 'windows'
  }
  // ------------------------------------
  return osPlatformMap[platform] || platform;
  // ------------------------------------
}
module.exports = async function setupProduct(argProductName, argSetupDirectory, argSetupVersion) {
  actionsCore.debug('Start setupProduct');
  // ------------------------------------
  // Download and install Product binary
  // doc: https://developer.hashicorp.com/terraform/language/expressions/version-constraints
  //      https://www.npmjs.com/package/@hashicorp/js-releases
  // ------------------------------------
  // Select the build for the given operating system platform and architecture
  let osArchitecture = getOsArchitecture()
  let osPlatform     = getOsPlatform()
  actionsCore.debug('osPlatform[' + osPlatform + '] osArchitecture[' + osArchitecture + ']');
  // Download metadata for a release using a semver range or "latest"
  let userAgent = packageConfig.name + '/' + packageConfig.version;
  let releaseData = await hashicorpReleases.getRelease(argProductName, argSetupVersion, userAgent);
  if (!releaseData) {
    actionsCore.setFailed('Unable to locate release data for ' + argProductName + ' ' + argSetupVersion);
    return;
  }
  actionsCore.debug('releaseData[' + JSON.stringify(releaseData) + ']');
  var releaseVersion = releaseData.version;
  // Locate the build for the given operating system platform and architecture
  var setupBuild = releaseData.getBuild(osPlatform, osArchitecture); 
  if (!setupBuild) {
    actionsCore.setFailed('No build found for version ' + releaseVersion + ' on ' + osPlatform + '[' + osArchitecture + ']');
    return;
  }
  // Download the build
  var setupBuildUrl = setupBuild.url;
  actionsCore.debug('setupBuildUrl[' + setupBuildUrl + ']');
  var downloadFilePath = await actionsToolCache.downloadTool(setupBuildUrl);
  actionsCore.info('downloadFilePath[' + downloadFilePath + ']')
  // Verify the build
  await releaseData.verify(downloadFilePath, setupBuild.filename);
  actionsCore.info(argProductName + ' downloaded and verified');
  // Extract the build
  var setupExtractDestinationDirectory = process.env.GITHUB_WORKSPACE + path.sep + argSetupDirectory;
  var setupExtractSourceFilePath = downloadFilePath + path.sep + setupBuild.filename;
  actionsCore.debug('setupExtractDestinationDirectory[' + setupExtractDestinationDirectory + ']');
  actionsCore.debug('setupExtractSourceFilePath[' + setupExtractSourceFilePath + ']');
  setupPath = await actionsToolCache.extractZip(setupExtractSourceFilePath, setupExtractDestinationDirectory );
  actionsCore.debug('Extracted to setupPath[' + setupPath + ']');
  if ( osPlatform === 'windows' ) {
    setupFilePath = setupPath + path.sep + argProductName + '.exe';
  } else {
    setupFilePath = setupPath + path.sep + argProductName;
  }
  setupConfig = {
    version: releaseVersion,
    dirPath: setupPath,
    filePath: setupFilePath
  }
  actionsCore.info(argProductName + ' product setup completed');
  // ------------------------------------
  actionsCore.debug('End setupProduct');
  return setupConfig;
  // ------------------------------------
}
// EOF