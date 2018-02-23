import fs from 'fs-extra'
import path from 'path'
import shell from 'shelljs'
import mkdirp from 'mkdirp'
import { default as initLib } from './init-lib'
import { ensureGitRepo } from './ensure-git-repo'
import Swarm from 'swarm-js'
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
export function getMangoAddress(directory) {
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
export function ensureMangoRepo(directory) {
    return ensureGitRepo(directory)
      .then(() => getMangoAddress(directory))
  }
  

/**
 * Setup mango config folder
 * @param {string} address 
 * @param {string} directory 
 */
export function setMango(address, directory) {
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
export function mangoInit(account, directory, opts) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, null, account)

    let contractAddress

    return mangoRepoLib.init(opts)
        .then(address => setMango(address, directory))
}

export function mangoStatus(mangoAddress, account) {

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

export function mangoIssues(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issues()
}

export function mangoGetIssueIpfs(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getIssue(issueId)
        .then(hash => ipfs.object.get(hash))
        .then(node => node.toJSON().data.toString())
}

export function mangoGetIssue(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getIssue(issueId)
        .then(hash => swarm.download(hash))
        .then(buf => swarm.toString(buf))
}

export function mangoNewIssueIpfs(mangoAddress, account, content) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issueCount()
        .then(count => {
            const id = count.toNumber()

            return ipfs.object.put({ Data: content, Links: [] })
                .then(node => mangoRepoLib.newIssue(node.toJSON().multihash))
        })
}

export function mangoNewIssue(mangoAddress, account, content) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.issueCount()
        .then(count => {
            const id = count.toNumber()

            return swarm.upload(content)
                .then(hash => mangoRepoLib.newIssue(hash))
        })
}

export function mangoUpdateIssueIpfs(mangoAddress, account, issueId, newIssueContent) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return ipfs.object.put({ Data: newIssueContent, Links: [] })
        .then(node => mangoRepoLib.setIssue(issueId, node.toJSON().multihash))
}

export function mangoUpdateIssue(mangoAddress, account, issueId, newIssueContent) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return swarm.upload(newIssueContent)
        .then(hash => mangoRepoLib.setIssue(issueId, hash))
}

export function mangoDeleteIssue(mangoAddress, account, issueId) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.deleteIssue(issueId)
}

export function mangoFork() {
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

export function mangoMergeFork() {
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

export function mangoPullRequests(mangoAddress, account) {
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

export function mangoGetPullRequest(mangoAddress, account) {
    const { host, port, id } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.getPullRequest(id)
        .then(forkAddress => console.log('Pull Request #' + id + ' -> ' + forkAddress))
}

export function mangoOpenPullRequest(mangoAddress, account) {
    const { host, port, issueId, forkAddress } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.openPullRequest(issueId, forkAddress)
        .then(id => console.log('[opened] Pull Request #' + id + ' for issue #' + issueId + ' -> ' + forkAddress))
}

export function mangoClosePullRequest(mangoAddress, account) {
    const { host, port, id } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.closePullRequest(id)
        .then(id => console.log('[closed] Pull Request #' + id))
}

export function mangoMaintainers(mangoAddress, account) {
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

export function mangoAddMaintainer(mangoAddress, account) {
    const { host, port, address } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.addMaintainer(address)
        .then(address => console.log('[added] Maintainer ' + address))
}

export function mangoRemoveMaintainer(mangoAddress, account) {
    const { host, port, address } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.removeMaintainer(address)
        .then(address => console.log('[removed] Maintainer ' + address))
}

export function mangoSetObsolete(mangoAddress, account) {
    const { host, port } = argv

    const mangoRepoLib = initLib(host, port, mangoAddress, account)

    return mangoRepoLib.setObsolete()
        .then(address => console.log('[obsolete] Mango repository ' + address))
}