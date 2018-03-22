const path = require('path')
const shell = require('shelljs')
const Web3 = require('web3')

const { getDefaultAccount } = require('./lib/web3-helpers')
const { ensureGitRepo } = require('./lib/ensure-git-repo')
const initLib = require('./lib/init-lib')
const { mangoInit, getMangoAddress, mangoStatus, ensureMangoRepo, mangoIssues, mangoGetIssue, mangoGetIssueIpfs, mangoNewIssueIpfs, mangoUpdateIssueIpfs, mangoDeleteIssue, mangoStakeIssue } = require('./lib/mango')

const defaultParams = {
  web3Host: 'localhost',
  web3Port: 8545
}







class OpenCollab {

  constructor(opts = {}) {
    this._opts = Object.assign(defaultParams, opts)
    this._web3 = new Web3(new Web3.providers.HttpProvider(`http:\/\/${opts.web3Host}:${web3Port}`))
    this._account = getDefaultAccount(this._web3)
  }

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
function init(directory, opts = {}) {
  if (!opts || !opts.name || !opts.description)
    throw('Invalid options')
  
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
          .then(() => getDefaultAccount())
          .then(account => mangoInit(account, directory, Object.assign(defaultParams, opts)))
}

/**
 * Check the status of an OpenCollab repository
 * @param {string} directory 
 */
async function status(directory) {
  await ensureMangoRepo(directory)
  let values = await Promise.all([getMangoAddress(directory), getDefaultAccount()])
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
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    .then(values => mangoIssues(values[0], values[1]))
}


/**
 * Get an issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 */
function getIssue(directory, issueId) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    //.then(values => mangoGetIssueIpfs(values[0], values[1], issueId))
    .then(values => mangoGetIssue(values[0], values[1], issueId))
}


/**
 * Create a new issue for an OpenCollab repository
 * @param {string} directory 
 * @param {string} name
 * @param {string} description
 * @param {string} issueContent 
 * @param {bool} isActive
 */
function newIssue(directory, name, description, issueContent, isActive = true) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    .then(values => mangoNewIssueIpfs(values[0], values[1], name, description, issueContent, isActive))
}


/**
 * Update a new issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 * @param {string} newIssueContent 
 */
function updateIssue(directory, issueId, newIssueContent) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    .then(values => mangoUpdateIssueIpfs(values[0], values[1], issueId, newIssueContent))
}


/**
 * @deprecated
 * Delete an issue for an OpenCollab repository
 * @param {string} directory 
 * @param {number} issueId
 */
function deleteIssue(directory, issueId) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    .then(values => mangoDeleteIssue(values[0], values[1], issueId))
}


function stakeIssue(directory, issueId, stake) {
  return ensureMangoRepo(directory)
    .then(() => Promise.all([getMangoAddress(directory), getDefaultAccount()]))
    .then(values => mangoStakeIssue(values[0], values[1], issueId, stake))
}

module.exports = {
  init,
  status,
  issues,
  getIssue,
  newIssue,
  updateIssue,
  deleteIssue,
  stakeIssue,
  getDefaultAccount
}