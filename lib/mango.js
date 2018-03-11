let fs = require('fs-extra')
let path = require('path')
let shell = require('shelljs')
let mkdirp = require('mkdirp')
let initLib = require('./init-lib')
let { ensureGitRepo } = require('./ensure-git-repo')
let Swarm = require('swarm-js')
//import IPFS from 'ipfs'
let ipfsAPI = require('ipfs-api')

const swarm = Swarm.at('http://swarm-gateways.net')
const ipfs = ipfsAPI('localhost', '5002', {protocol: 'http'}) 

const RPC_HOST = 'localhost'
const RPC_PORT = '8545'

const CONTRACT_DIR = '.mango/contract/'
const ISSUES_DIR = '.mango/issues/'

let argv = {
  host: RPC_HOST,
  port: RPC_PORT
}



/**
 * Returns the contract address of the mango directory
 * @param {string} directory 
 */
function getMangoAddress(directory) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(directory, '.mango/contract'), 'utf-8', (err, data) => {
        if (err) {
          reject(new Error('Need to be in a Mango repository.'))
        } else {
          resolve(data)
        }
      })
    })
  }
  

/**
 * Ensure the directory path contains a .mango and a .git folder
 * @param {string} directory 
 */
function ensureMangoRepo(directory) {
    return ensureGitRepo(directory)
      .then(() => getMangoAddress(directory))
  }
  

/**
 * Setup mango config folder
 * @param {string} address 
 * @param {string} directory 
 */
function setMango(address, directory) {
    return new Promise((resolve, reject) => {
        mkdirp(path.join(directory, '.mango/issues'), err => {
          if (err) 
            return reject(err)
          else {
            fs.writeFile(path.join(directory, '.mango/contract'), address, err => {
              if (err) 
                return reject(err)              
              else 
                resolve(address)              
            })
          }
        })
    })
  }

/**
 * Initialize Mango
 * @param {string} account 
 * @param {string} directory 
 * @param {string} opts.name 
 * @param {string} opts.description
 * @param {number} opts.voterRewardPercentage
 * @param {number} opts.voterPenaltyPercentage
 */
function mangoInit(account, directory, opts) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, null, account)

    let contractAddress

    return mangoRepoLib.init(opts)
        .then(address => setMango(address, directory))
}

function mangoStatus(mangoAddress, account) {

    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return Promise.all([
            mangoRepoLib.refs(), 
            mangoRepoLib.snapshots()
        ])
        .then(results => {
            return {
                references: results[0],
                snapshots: results[1],
                contract: mangoRepoLib
            }
        })

}

function mangoIssues(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issues()
}

function mangoGetIssueIpfs(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getIssue(issueId)
        .then(hash => ipfs.object.get(hash))
        .then(node => node.toJSON().data.toString())
}

function mangoGetIssue(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getIssue(issueId)
                       .then(issueFields => createIssueFromFieldsArray(issueFields))
}

function mangoNewIssueIpfs(mangoAddress, account, name, description, content) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issueCount()
        .then(count => {
            const id = count.toNumber()

            return ipfs.object.put({ Data: content, Links: [] })
                .then(node => mangoRepoLib.newIssue(name, description, node.toJSON().multihash))
        })
}

function mangoNewIssue(mangoAddress, account, content) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issueCount()
        .then(count => {
            const id = count.toNumber()

            return swarm.upload(content)
                .then(hash => mangoRepoLib.newIssue(hash))
        })
}

function mangoUpdateIssueIpfs(mangoAddress, account, issueId, newIssueContent) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return ipfs.object.put({ Data: newIssueContent, Links: [] })
        .then(node => mangoRepoLib.setIssue(issueId, node.toJSON().multihash))
}

function mangoUpdateIssue(mangoAddress, account, issueId, newIssueContent) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return swarm.upload(newIssueContent)
        .then(hash => mangoRepoLib.setIssue(issueId, hash))
}

function mangoDeleteIssue(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.deleteIssue(issueId)
}

function mangoFork() {
    console.log('Forking Mango repository...')

    const { path } = argv

    const forkIgnore = [
        '.mango',
        'node_modules',
    ];

    const filter = name => {
        return forkIgnore.reduce((acc, file) => {
            return acc && !~name.indexOf(file)
        }, true)
    }

    fs.copy('.', path, { filter: filter }, err => {
        if (err) {
            console.error(err)
        } else {
            console.log('Mango repository forked to ' + path)
        }
    })
}

function mangoMergeFork() {
    console.log('Merging fork into Mango repository...')

    const { path } = argv

    if (shell.exec('git remote add fork ' + path).code !== 0) {
        shell.echo('Error: Git remote add failed')
        shell.exit(1)
    }

    if (shell.exec('git fetch fork').code !== 0) {
        shell.echo('Error: Git fetch failed')
        shell.exit(1)
    }

    if (shell.exec('git merge --no-ff --no-commit --allow-unrelated-histories fork/master').code !== 0) {
        shell.echo('Error: Git merge failed')
        shell.exit(1)
    }

    if (shell.exec('git reset HEAD .mango').code !== 0) {
        shell.echo('Error: Git reset failed')
        shell.exit(1)
    }

    if (shell.exec('git checkout -- .mango').code !== 0) {
        shell.echo('Error: Git checkout failed')
        shell.exit(1)
    }

    if (shell.exec('git commit -m \"merged fork/master\"').code !== 0) {
        shell.echo('Error: Git commit failed')
        shell.exit(1)
    }

    if (shell.exec('git remote rm fork').code !== 0) {
        shell.echo('Error: Git remote rm failed')
        shell.exit(1)
    }

    console.log('Fork merged into Mango repository.')
}

function mangoPullRequests(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.pullRequests()
        .then(pullRequests => {
            let noPullRequests = true

            pullRequests.map((pullRequest, i) => {
                if (pullRequest != '0x0000000000000000000000000000000000000000') {
                    noPullRequests = false
                    console.log('Pull Request #' + i + ' -> ' + pullRequest)
                }
            })

            if (noPullRequests) {
                console.log('No pull requests')
            }
        });
}

function mangoGetPullRequest(mangoAddress, account) {
    const { host, port, id } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getPullRequest(id)
        .then(forkAddress => console.log('Pull Request #' + id + ' -> ' + forkAddress))
}

function mangoOpenPullRequest(mangoAddress, account) {
    const { host, port, issueId, forkAddress } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.openPullRequest(issueId, forkAddress)
        .then(id => console.log('[opened] Pull Request #' + id + ' for issue #' + issueId + ' -> ' + forkAddress))
}

function mangoClosePullRequest(mangoAddress, account) {
    const { host, port, id } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.closePullRequest(id)
        .then(id => console.log('[closed] Pull Request #' + id))
}

function mangoMaintainers(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.maintainers()
        .then(maintainers => {
            maintainers.map(maintainer => {
                if (maintainer != '0x0000000000000000000000000000000000000000') {
                    console.log(maintainer)
                }
            });
        });
}

function mangoAddMaintainer(mangoAddress, account) {
    const { host, port, address } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.addMaintainer(address)
        .then(address => console.log('[added] Maintainer ' + address))
}

function mangoRemoveMaintainer(mangoAddress, account) {
    const { host, port, address } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.removeMaintainer(address)
        .then(address => console.log('[removed] Maintainer ' + address))
}

function mangoSetObsolete(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.setObsolete()
        .then(address => console.log('[obsolete] Mango repository ' + address))
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
    getMangoAddress,
    ensureMangoRepo,
    setMango,
    mangoInit,
    mangoStatus,
    mangoIssues,
    mangoGetIssueIpfs,
    mangoGetIssue,
    mangoNewIssueIpfs,
    mangoNewIssue,
    mangoUpdateIssueIpfs,
    mangoUpdateIssue,
    mangoDeleteIssue,
    mangoFork,
    mangoMergeFork,
    mangoPullRequests,
    mangoGetPullRequest,
    mangoOpenPullRequest,
    mangoClosePullRequest,
    mangoMaintainers,
    mangoAddMaintainer,
    mangoRemoveMaintainer,
    mangoSetObsolete
}