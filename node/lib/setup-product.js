// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os   = require('node:os');   // Node's operating system
const fs   = require('node:fs');   // Node's file system
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore       = require('@actions/core');          // Microsoft's actions toolkit
const actionsToolCache  = require('@actions/tool-cache');    // Microsoft's actions toolkit
const semver            = require('semver')                  // Node's semver module
const hashicorpReleases = require('@hashicorp/js-releases'); // Hashicorp's releases API
// ------------------------------------
// Internal modules
// ------------------------------------
// None
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
module.exports = async function setupProduct( argProductName,
                                              argSetupVersion, 
                                              argVersionInvalidHandling, 
                                              argIncludePrerelease, 
                                              argUserAgent) {
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
  if (argSetupVersion !== 'latest') {
    var setupVersionRange = semver.validRange(argSetupVersion, { argIncludePrerelease, loose: true });
    if ( setupVersionRange == null) {
      var setupVersionValid = false;
      if ( argVersionInvalidHandling === 'fail' ) {
        actionsCore.setFailed('Invalid version [' + argSetupVersion + ']');
        return;
      } else if ( argVersionInvalidHandling === 'latest' ) {
        actionsCore.warning('Invalid version [' + argSetupVersion + '] using latest');
        var setupVersion = 'latest';
      } else {
        actionsCore.setFailed('Invalid version[' + argSetupVersion + ']  unknown versionInvalidHandling[' + argVersionInvalidHandling + ']');
        return;
      }
    } else {
      var setupVersionValid = true;
      var setupVersion = argSetupVersion;
    }
  } else {
    var setupVersionValid = true;
    var setupVersion = argSetupVersion;
  }
  // Download metadata for a release using a semver range or "latest"
  if ( argIncludePrerelease)  {
    actionsCore.info('Including pre-release versions');
  }
  let releaseData = await hashicorpReleases.getRelease(argProductName, setupVersion, argUserAgent, argIncludePrerelease);
  if (!releaseData) {
    actionsCore.setFailed('Unable to locate release data for ' + argProductName + ' ' + setupVersion);
    return;
  }
  actionsCore.debug('releaseData[' + JSON.stringify(releaseData) + ']');
  var productVersion = releaseData.version;
  // Locate the build for the given operating system platform and architecture
  var setupBuild = releaseData.getBuild(osPlatform, osArchitecture); 
  if (!setupBuild) {
    actionsCore.setFailed('No build found for version ' + productVersion + ' on ' + osPlatform + '[' + osArchitecture + ']');
    return;
  }
  // check if the product is already cached
  let cachedProductPath = actionsToolCache.find(argProductName, productVersion, osArchitecture);
  if (cachedProductPath) {
    actionsCore.info( argProductName + ' found in cache' );
    var productPath = cachedProductPath;
  } else {
    // Download the build
    var setupBuildUrl = setupBuild.url;
    actionsCore.debug('setupBuildUrl[' + setupBuildUrl + ']');
    var downloadFilePath = await actionsToolCache.downloadTool(setupBuildUrl);
    actionsCore.debug('downloadFilePath[' + downloadFilePath + ']')
    // Verify the build
    await releaseData.verify(downloadFilePath, setupBuild.filename);
    actionsCore.info(argProductName + ' downloaded and verified');
    // Extract the build
    if ( osPlatform === 'windows' ) {
      var setupExtractSourceFilePath = downloadFilePath + '.zip';
      fs.rename(downloadFilePath, setupExtractSourceFilePath, (error) => {
        if (error) {
          actionsCore.setFailed('Unable to rename file [' + downloadFilePath + '] to [' + setupExtractSourceFilePath + ']');
          return;
        }
        actionsCore.debug('Successfully renamed file[' + setupExtractSourceFilePath + ']')
      });
    } else {
      var setupExtractSourceFilePath = downloadFilePath;
    }
    actionsCore.debug('setupExtractSourceFilePath[' + setupExtraSet terraform versionctSourceFilePath + ']');
    extractPath = await actionsToolCache.extractZip(setupExtractSourceFilePath, undefined );
    actionsCore.debug('Extracted to extractPath[' + extractPath + ']');
    // cache the extracted product
    actionsCore.info( 'Cache ' + argProductName );
    var productPath = await actionsToolCache.cacheDir(
      extractPath,
      argProductName,
      productVersion,
      osArchitecture
    );
  }
  actionsCore.debug('productPath[' + productPath + ']');
  // determine the setup file path
  if ( osPlatform === 'windows' ) {
    var productFilePath = productPath + path.sep + argProductName + '.exe';
  } else {
    var productFilePath = productPath + path.sep + argProductName;
  }
  actionsCore.info(argProductName + ' product setup completed');
  // export variables
  actionsCore.setOutput( "setupVersion", productVersion );
  actionsCore.setOutput( "setupPath", productPath );
  actionsCore.exportVariable( 'TF_CLI_PATH', productPath );
  actionsCore.addPath( productPath );
  // setup return data
  returnData = {
    version: productVersion,
    dirPath: productPath,
    filePath: productFilePath,
    requestedVersionValid: setupVersionValid
  }
  // ------------------------------------
  actionsCore.debug('End setupProduct');
  return returnData;
  // ------------------------------------
}
// EOF