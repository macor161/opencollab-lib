const path = require('path')
const Web3 = require('web3')
let ipfsAPI = require('ipfs-api')
const { getDefaultAccount } = require('./lib/web3-helpers')
const { isOpenCollabRepo } = require('./lib/validation')
const common = require('./lib/common')
const initLib = require('./lib/init-lib')



module.exports = class OpenCollab {

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

    //this._init()
  }

  /**
   * Initialize inner state of object.
   */
  async _init() {
    if (!this._isInitialized) {

      this._account = await getDefaultAccount(this._web3)
      this._ipfs = ipfsAPI('localhost', '5002', {protocol: 'http'}) 

      if (await isOpenCollabRepo(this._repoPath)) {
        this.isOpenCollabRepo = true
        this._contractAddress = await common.getContractAddress(this._repoPath)
      }
      else
        this.isOpenCollabRepo = false

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
    this.isOpenCollabRepo = true
    await common.createOpenCollabDirectory(this._repoPath, this._contractAddress)

    return this._contractAddress
  }


  /**
   * Returns the status of the OpenCollab repo
   */
  async status() {

    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

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

  /**
   * Returns the web3 account for this OpenCollab instance
   */
  async getWeb3Account() { return getDefaultAccount(this._web3) }


  /**
   * List issues for an OpenCollab repository
   * @param {string} directory 
   */
  async issues() {
    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)

    return (await mangoRepoLib.issues())
            .map((issueFields, i) => Object.assign({ id: i}, common.createIssueFromFieldsArray(issueFields)))
  }

  /**
   * Get an issue for an OpenCollab repository
   * @param {number} issueId
   */
  async getIssue(issueId) {
    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)

    let issue = common.createIssueFromFieldsArray(await mangoRepoLib.getIssue(issueId))
    issue.id = issueId
    issue.content = (await this._ipfs.object.get(issue.hash)).toJSON().data.toString()

    return issue
  }


  /**
   * Create a new issue for an OpenCollab repository
   * @param {string} name
   * @param {string} description
   * @param {string} issueContent 
   * @param {bool} isActive
   */
  async newIssue(name, description, issueContent, isActive = true) {
    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)

    const count = await mangoRepoLib.issueCount()

    const id = count.toNumber()

    const node = await this._ipfs.object.put({ Data: issueContent, Links: [] })
    return mangoRepoLib.newIssue(name, description, node.toJSON().multihash, isActive)
  }

  /**
   * Update a new issue for an OpenCollab repository
   * @param {number} issueId
   * @param {string} newIssueContent 
   */
  async updateIssue(issueId, newIssueContent) {  
    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)

    const node = await this._ipfs.object.put({ Data: newIssueContent, Links: [] })
    return mangoRepoLib.setIssue(issueId, node.toJSON().multihash)
  }

  /**
   * Stake tokens to an issue
   * @param {number} issueId 
   * @param {number} stake 
   */
  async stakeIssue(issueId, stake) {
    await this._init()

    if (!this.isOpenCollabRepo)
      throw 'Not an OpenCollab repository'

    const mangoRepoLib = initLib(this._opts.web3Host, this._opts.web3Port, this._contractAddress, this._account)
    
    return mangoRepoLib.stakeIssue(issueId, stake)
  }


}


