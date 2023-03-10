// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const fs = require('node:fs') // Node's file system module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core') // Microsoft's actions toolkit
// ------------------------------------
// Internal modules
// ------------------------------------
// None
// ------------------------------------
// ------------------------------------
module.exports = async function getFileContent(argPathToFile) {
  actionsCore.debug('Start getFileContent')
  // ------------------------------------
  if (!fs.existsSync(argPathToFile)) {
    actionsCore.setFailed('file[' + argPathToFile + '] does not exist')
    return
  }
  // read setup file
  try {
    var readFileData = fs.readFileSync(argPathToFile, 'utf8')
  } catch (error) {
    actionsCore.setFailed('Unable to read file[' + argPathToFile + ']')
    return
  }
  // ------------------------------------
  actionsCore.debug('End getFileContent')
  return readFileData
  // ------------------------------------
}
// EOF
