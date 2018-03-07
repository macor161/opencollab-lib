let fs = require('fs-extra')
let path = require('path')

/**
 * Ensure a git repo exists at a specified directory path
 * @param {string} directory 
 */
function ensureGitRepo(directory) {
    return new Promise((resolve, reject) => {
      fs.stat(path.join(directory, '.git'), (err, stats) => {
        if (err) {
          reject(new Error('Need to be in a Git repository.'))
        } else {
          resolve(true)
        }
      })
    })
  }


module.exports = { ensureGitRepo }