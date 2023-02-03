// BOF
// ------------------------------------
// Node.js built-in modules
// ------------------------------------
const os   = require('node:os');   // Node's operating system
const path = require('node:path'); // Node's path module
// ------------------------------------
// External modules
// ------------------------------------
const actionsCore = require('@actions/core');   // Microsoft's actions toolkit core
const github      = require('@actions/github'); // Microsoft's actions github
// ------------------------------------
// Internal modules
// ------------------------------------
const getFileContent = require('./get-file-content.js'); // Internal utilities
// ------------------------------------
// ------------------------------------
module.exports = async function gitCommit( argApiToken,
                                           argRootDirectory,
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
  var getCommitData = await octokit.rest.git.getCommit({owner: context.repo.owner,
                                                        repo: context.repo.repo,
                                                        commit_sha: getRefData.data.object.sha});
  actionsCore.debug('returnData[' + JSON.stringify(getCommitData) + ']');
  if ( getCommitData.status !== 200 ) {
    actionsCore.setFailed('Unable to retrieve commit[' + getRefData.data.object.sha + '] data');
  }
  // create blob data
  var gitBlobData = [];
  for ( let i = 0; i < argFileList.length; i++ ) {
    actionsCore.info('readfile[' + argFileList[i] + ']')
    let pathToFile = argRootDirectory + path.sep + argFileList[i];
    let blobData = await getFileContent( pathToFile );
    actionsCore.info('Created blob for file[' + pathToFile + ']')
    var createBlobData = await octokit.rest.git.createBlob( { owner: context.repo.owner,
                                                              repo: context.repo.repo,
                                                              content: blobData,
                                                              encoding: 'utf-8' } );
    // add blob data to array
    gitBlobData.push({
      path: argFileList[i],
      blobUrl: createBlobData.data.url,
      blobSha: createBlobData.data.sha,
    });
  }
  actionsCore.debug('gitBlobData[' + JSON.stringify(gitBlobData) + ']');
  // build a tree array
  let treeArray = [];
  for ( let i = 0; i < gitBlobData.length; i++ ) {
    treeArray.push({
      path: gitBlobData[i].path,
      mode: '100644',
      type: 'blob',
      sha: gitBlobData[i].blobSha,
    } );
  }
  actionsCore.info('treeArray[' + JSON.stringify(treeArray) + ']');
  // create tree
  var createTreeData = await octokit.rest.git.createTree( { owner: context.repo.owner,
                                                            repo: context.repo.repo,
                                                            tree: treeArray,
                                                            base_tree: getCommitData.data.tree.sha } );
  actionsCore.info('createTreeData[' + JSON.stringify(createTreeData) + ']');
  // setup return data
  returnData = {
    'treeSha': createTreeData.sha,
    'treeUrl': createTreeData.url,
    'treeData': createTreeData.tree,
  };
  // ------------------------------------
  actionsCore.debug('End gitCommit');
  return returnData;
  // ------------------------------------
}
// EOF