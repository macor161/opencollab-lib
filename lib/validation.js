const fs = require('fs-extra')
const path = require('path')

const OPEN_COLLAB_DIR = '.mango'

/**
 * Returns true if the path is an OpenCollab repository
 * @param {string} repoPath 
 */
async function isOpenCollabRepo(repoPath) {
   return fs.pathExists(path.join(repoPath, OPEN_COLLAB_DIR))
}
  

/**
 * Ensure a git repo exists at a specified directory path
 * @param {string} directory 
 */
async function isGitRepo(directory) {
   return fs.pathExists(path.join(repoPath, '.git'))
}

module.exports = {
    isOpenCollabRepo,
    isGitRepo
}