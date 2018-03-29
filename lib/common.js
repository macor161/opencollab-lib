const fs = require('fs-extra')
const path = require('path')
const { isOpenCollabRepo } = require('./validation')

const OPEN_COLLAB_DIR = '.mango'


/**
 * Returns the contract address of the mango directory
 * @param {string} repoPath 
 */
async function getContractAddress(repoPath) {
  if (await isOpenCollabRepo(repoPath)) 
    return fs.readFile(path.join(repoPath, OPEN_COLLAB_DIR, 'contract'), 'utf-8')
  else
    throw 'Not an OpenCollab repository'
}


/**
 * Create OpenCollab config directory
 * @param {string} repoPath 
 * @param {string} contractAddress 
 */
async function createOpenCollabDirectory(repoPath, contractAddress) {
  await fs.mkdirp(path.join(repoPath, OPEN_COLLAB_DIR))
  return fs.writeFile(path.join(repoPath, OPEN_COLLAB_DIR, 'contract'), contractAddress)
}


/**
 * Returns an issue object from an array of the
 * following fields: [name, description, hash, totalStake, openPullRequest,
 * pullRequestId, active]
 * 
 * @param {array} fields 
 */
function createIssueFromFieldsArray(fields) {
  if (fields.length !== 7)
      throw 'Wrong number of fields'

  return {
      name: fields[0],
      description: fields[1],
      hash: fields[2],
      totalStake: fields[3],
      openPullRequest: fields[4],
      pullRequestId: fields[5],
      active: fields[6]
  }
}


module.exports = {
  getContractAddress,
  createOpenCollabDirectory,
  createIssueFromFieldsArray
}