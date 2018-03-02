import mkdirp from 'mkdirp'
import fs from 'fs-extra'
import path from 'path'
import shell from 'shelljs'
import Web3 from 'web3'

import { ensureGitRepo } from './lib/ensure-git-repo'
import { default as initLib } from './lib/init-lib'
import { mangoInit, getMangoAddress, mangoStatus, ensureMangoRepo, mangoIssues, mangoGetIssueIpfs, mangoNewIssueIpfs, mangoUpdateIssueIpfs, mangoDeleteIssue } from './lib/mango'


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
 * @param {string} opts.name 
 * @param {string} opts.description
 * @param {number} opts.maintainerPercentage
 * @param {number} opts.voterRewardPercentage
 * @param {number} opts.voterPenaltyPercentage
 * @param {number} opts.voterDeposit
 * @param {number} opts.maintainerStake
 * @param {number} opts.contributorStake
 * @param {number} opts.challengerStake
 * @param {number} opts.reviewPeriodLength
 * @param {number} opts.votingCommitPeriodLength
 * @param {number} opts.votingRevealPeriodLength
 * @param {number} opts.tokenCount
 */
function init(directory, opts) {
  
  const defaultParams = {
    maintainerPercentage: 50,
    voterRewardPercentage: 5,
    voterPenaltyPercentage: 20,
    voterDeposit: 1000000000000000000,
    maintainerStake: 1000000000000000000,
    contributorStake: 1000000000000000000,
    challengerStake: 1000000000000000000,
    reviewPeriodLength: 24 * 60 * 60, // 1 day
    votingCommitPeriodLength: 24 * 60 * 60, // 1 day
    votingRevealPeriodLength: 24 * 60 * 60, // 1 day
    tokenCount: 60000000000000000000
  }

  return ensureGitRepo(directory)
          .then(() => getAccount())
          .then(account => mangoInit(account, directory, Object.assign(opts, defaultParams)))
}

/**
 * Check the status of an OpenCollab repository
 * @param {string} directory 
 */
async function status(directory) {
  await ensureMangoRepo(directory)
  let values = await Promise.all([getMangoAddress(directory), getAccount()])
  let status = Object.assign({ mangoAddress: values[0], name: path.basename(directory).replace('.git', '') }, await mangoStatus(values[0], values[1]))
  
  let repoInfo = await Promise.all([ 
      status.contract.getName(),
      status.contract.getDescription(),
      status.contract.issueCount()
    ])

  status.name = repoInfo[0]
  status.description = repoInfo[1]
  status.issueCount = repoInfo[2]

  return status
}


/**
 * List issues for an OpenCollab repository
 * @param {string} directory 
 */
function issues(directory) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
    .then(values => mangoIssues(values[0], values[1]))
}


/**
 * Get an issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 */
function getIssue(directory, issueId) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
    .then(values => mangoGetIssueIpfs(values[0], values[1], issueId))
}


/**
 * Create a new issue for an OpenCollab repository
 * @param {string} directory 
 * @param {string} issueContent 
 */
function newIssue(directory, issueContent) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
    .then(values => mangoNewIssueIpfs(values[0], values[1], issueContent))
}


/**
 * Update a new issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 * @param {string} newIssueContent 
 */
function updateIssue(directory, issueId, newIssueContent) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
    .then(values => mangoUpdateIssueIpfs(values[0], values[1], issueId, newIssueContent))
}


/**
 * Delete an issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 */
function deleteIssue(directory, issueId) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getAccount()]))
    .then(values => mangoDeleteIssue(values[0], values[1], issueId))
}

module.exports = {
  init,
  status,
  issues,
  getIssue,
  newIssue,
  updateIssue,
  deleteIssue
}