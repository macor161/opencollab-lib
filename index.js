const path = require('path')
const shell = require('shelljs')
const Web3 = require('web3')

const { getDefaultAccount } = require('./lib/web3-helpers')
const { isOpenCollabRepo } = require('./lib/validation')
const common = require('./lib/common')
const initLib = require('./lib/init-lib')
const { mangoInit, getMangoAddress, mangoStatus, ensureMangoRepo, mangoIssues, mangoGetIssue, mangoGetIssueIpfs, mangoNewIssueIpfs, mangoUpdateIssueIpfs, mangoDeleteIssue, mangoStakeIssue } = require('./lib/mango')



class OpenCollab {

  /**
   * Creates a new OpenCollab object based on a repository path
   * 
   * @param {string} repoPath
   * @param {string} [opts.web3Host = 'localhost']
   * @param {number} [opts.web3Port = 8545]
   */
  constructor(repoPath, opts = {}) {
    const defaultParams = {
      web3Host: 'localhost',
      web3Port: 8545
    }

    this._repoPath = repoPath
    this._opts = Object.assign(defaultParams, opts)
    this._web3 = new Web3(new Web3.providers.HttpProvider(`http:\/\/${this._opts.web3Host}:${this._opts.web3Port}`))
    this._isInitialized = false

    this._init()
  }

  /**
   * Initialize inner state of object.
   */
  async _init() {
    if (!this._isInitialized) {

      this._account = await getDefaultAccount(this._web3)

      if (await isOpenCollabRepo(this._repoPath)) {
        this._isOpenCollabRepo = true
        this._contractAddress = await common.getContractAddress(this._repoPath)
      }
      else
        this._isOpenCollabRepo = false

      this._isInitialized = true
    }
  }


  /**
   * Initialize an OpenCollab repo at a specified directory path
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
  async init(opts = {}) {
    if (!opts || !opts.name || !opts.description)
      throw('Invalid options')

    await this._init()
    
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

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, null, this._account)

    this._contractAddress = await mangoRepoLib.init(opts)
    await common.createOpenCollabDirectory(this._repoPath, this._contractAddress)

    return this._contractAddress
  }


  /**
   * Returns the status of the OpenCollab repo
   */
  async status() {

    await this._init()

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)
  

    const [name, description, issueCount, references, snapshots] = await Promise.all([ 
      mangoRepoLib.mangoRepo.getName(),
      mangoRepoLib.mangoRepo.getDescription(),
      mangoRepoLib.mangoRepo.issueCount(),
      mangoRepoLib.refs(),
      mangoRepoLib.snapshots()
    ])

    return {
      name,
      description,
      issueCount,
      mangoAddress: this._contractAddress,
      contractAddress: this._contractAddress,
      references,
      snapshots,
      contract: mangoRepoLib
    }
  }  


}





async function init(directory, opts = {}) {
  const repo = new OpenCollab(directory)
  return repo.init(opts)
}


async function status(directory) {
  const repo = new OpenCollab(directory)
  return repo.status()
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