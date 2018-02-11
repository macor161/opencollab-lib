import mkdirp from 'mkdirp'
import fs from 'fs-extra'
import path from 'path'
import shell from 'shelljs'
import Web3 from 'web3'

import { ensureGitRepo } from './lib/ensure-git-repo'
import { default as initLib } from './lib/init-lib'
import IssueEditor from './lib/issueEditor'
import Swarm from 'swarm-js'
import { mangoInit, getMangoAddress, mangoStatus, ensureMangoRepo } from './lib/mango'

const swarm = Swarm.at('http://swarm-gateways.net')

const RPC_HOST = 'localhost'
const RPC_PORT = '8545'

const CONTRACT_DIR = '.mango/contract/'
const ISSUES_DIR = '.mango/issues/'

let argv = {
  host: RPC_HOST,
  port: RPC_PORT
}




function getAccount() {
  const { host, port } = argv

  const provider = new Web3.providers.HttpProvider(`http:\/\/${host}:${port}`)
  const web3 = new Web3(provider)

  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(accounts[0])
      }
    })
  })
}






/**
 * Initialize an OpenCollab repo at a specified directory path
 * @param {string} directory 
 */
function init(directory) {
  return ensureGitRepo(directory)
          .then(() => getAccount())
          .then(account => mangoInit(account, directory))
}

/**
 * Check the status of a Mango repository
 * @param {string} directory 
 */
function status(directory) {
  return ensureMangoRepo(directory)
          .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
          .then(values => mangoStatus(values[0], values[1]))
          .then(status => Object.assign(status, { name: path.basename(directory).replace('.git', '') }))
          .catch(err => console.error(err))
}


module.exports = {
  init,
  status
}