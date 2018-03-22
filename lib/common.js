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


module.exports = {
  getContractAddress,
  createOpenCollabDirectory
}