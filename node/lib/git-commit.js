// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os = require('node:os'); // Node's operating system
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core');   // Microsoft's actions toolkit core
const github      = require('@actions/github'); // Microsoft's actions github
// ------------------------------------
// Internal modules
// ------------------------------------
const utilities = require('./lib/utilities.js');  // Internal utilities
// ------------------------------------
// ------------------------------------
module.exports = async function gitCommit( argApiToken, 
                                           argFileList) {
  actionsCore.debug('Start gitCommit');
  //
  var context = github.context;
  var octokit = github.getOctokit(argApiToken);
  let getRef  = context.ref.replace(/^refs\//i, '');
  actionsCore.info('ref[' + getRef + ']');
  // Get the current reference data
  let getRefData = await octokit.rest.git.getRef({owner: context.repo.owner,
                                                  repo: context.repo.repo,
                                                  ref: getRef});
  actionsCore.debug('returnData[' + JSON.stringify(getRefData) + ']');
  if ( getRefData.status !== 200 ) {
    actionsCore.setFailed('Unable to retrieve ref[' + getRef + '] data');
  }
  // retrieve the current commit data
  let getCommitData = await octokit.rest.git.getCommit({owner: context.repo.owner,
                                                        repo: context.repo.repo,
                                                        commit_sha: getRefData.data.object.sha});
  actionsCore.info('returnData[' + JSON.stringify(getCommitData) + ']');
  if ( getCommitData.status !== 200 ) {
    actionsCore.setFailed('Unable to retrieve commit[' + getRefData.data.object.sha + '] data');
  }
  // create blob data
  let gitBlobData = [];
  for ( let i = 0; i < argFileList.length; i++ ) {
    actionsCore.info('Created blob for file[' + argFileList[i] + ']')
    let blobData = await utilities.getFileContent(argFileList[i]);
    let createBlobData = await octokit.rest.git.createBlob({owner: context.repo.owner,
                                                            repo: context.repo.repo,
                                                            content: blobData,
                                                            encoding: 'utf-8'});
    // add blob data to array
    gitBlobData.push({
      path: argFileList[i],
      bobUrl: createBlobData.data.url,
      bobSha: createBlobData.data.sha,
    });
  }
  actionsCore.info('gitBlobData[' + JSON.stringify(gitBlobData) + ']');
 
  // setup return data
  returnData = {
    'gitBlobData': gitBlobData,
  };
  // ------------------------------------
  actionsCore.debug('End gitCommit');
  return returnData;
  // ------------------------------------
}
// EOF