// BOF
// ------------------------------------
const packageConfig = require('../package.json');
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os = require('node:os'); // Node's operating system module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore       = require('@actions/core');          // Microsoft's actions toolkit
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
module.exports = async function setupTerraform(argProductName, argSetupDirectory, argSetupVersion) {
  actionsCore.debug('Start setupTerraform');
  // ------------------------------------
  // Download and install Terraform binary
  //
  // doc: https://developer.hashicorp.com/terraform/language/expressions/version-constraints
  //      https://www.npmjs.com/package/@hashicorp/js-releases
  // ------------------------------------
  // Select the build for the given operating system platform and architecture
  let osArchitecture = getOsArchitecture()
  let osPlatform     = getOsPlatform()
  actionsCore.info('osPlatform[' + osPlatform + '] osArchitecture[' + osArchitecture + ']');
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
    actionsCore.setFailed('No build found for ' + osPlatform + ' ' + osArchitecture);
    return;
  }
  // Download the build
  var setupBuildUrl = setupBuild.url;
  actionsCore.info('setupBuildUrl[' + setupBuildUrl + ']');
  var downloadDirectory = process.env.GITHUB_WORKSPACE
  var downloadFilePath  = downloadDirectory + '/' + setupBuild.filename;
  actionsCore.info('downloadDirectory[' + downloadDirectory + ']');
  await releaseData.download(setupBuildUrl, downloadFilePath, userAgent);
  actionsCore.info('Done downloading to ' + downloadFilePath)
  // Verify the build
  await releaseData.verify(downloadFilePath, setupBuild.filename);
  actionsCore.info('Done verifying ' + downloadFilePath)
  // Extract the build
  var setupDirectory = process.env.GITHUB_WORKSPACE + '/' + argSetupDirectory
  actionsCore.info('setupDirectory[' + setupDirectory + ']');
  let setupPath = releaseData.unpack(setupDirectory, downloadFilePath);
  // ------------------------------------
  actionsCore.debug('End setupTerraform');
  return setupPath;
  // ------------------------------------
}
// EOF