// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os = require('node:os'); // Node's operating system module
// ------------------------------------
// External modules
// ------------------------------------
const core              = require('@actions/core');          // Microsoft's actions toolkit
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// ------------------------------------
module.exports = async function getOsArchitecture() {
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
module.exports = async function getOsPlatform() {
  // doc: https://nodejs.org/api/os.html#os_os_platform
  let platform = os.platform();
  let osPlatformMap = {
    win32: 'windows'
  }
  // ------------------------------------
  return osPlatformMap[platform] || platform;
  // ------------------------------------
}
module.exports = async function setupTerraform(argSetupVersion) {
  core.debug('Start setupTerraform');
  core.info('argSetupVersion[' + argSetupVersion + ']');
  // Select the build for the given operating system platform and architecture
  let osArchitecture = os.getOsArchitecture()
  let osPlatform     = os.getOsPlatform()
  var setupBuild     = hashicorpReleases.getBuild(osPlatform, osArchitecture); 
  core.info('setupBuild[' + JSON.stringify(setupBuild) + ']');


  var setupVersion = argSetupVersion;
  // ------------------------------------
  core.debug('End setupTerraform');
  return setupVersion;
  // ------------------------------------
}
// EOF