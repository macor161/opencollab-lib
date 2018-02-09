import yargs from 'yargs';
import mkdirp from 'mkdirp';
import fs from 'fs-extra';
import path from 'path';
import shell from 'shelljs';
import Web3 from 'web3';

import { default as initLib } from './lib/init-lib';
import IssueEditor from './lib/issueEditor';
import Swarm from 'swarm-js';

const swarm = Swarm.at('http://swarm-gateways.net');

const RPC_HOST = 'localhost';
const RPC_PORT = '8545';

const CONTRACT_DIR = '.mango/contract/;';
const ISSUES_DIR = '.mango/issues/';

let argv = {
  host: RPC_HOST,
  port: RPC_PORT
}


/**
 * Ensure a git repo exists at a specified directory path
 * @param {string} directory 
 */
function ensureGitRepo(directory) {
  return new Promise((resolve, reject) => {
    fs.stat(path.join(directory, '.git'), (err, stats) => {
      if (err) {
        reject(new Error('Need to be in a Git repository.'));
      } else {
        resolve(true);
      }
    });
  });
}

function getMangoAddress() {
  return new Promise((resolve, reject) => {
    fs.readFile('.mango/contract', 'utf-8', (err, data) => {
      if (err) {
        reject(new Error('Need to be in a Mango repository.'));
      } else {
        resolve(data);
      }
    });
  });
}

function ensureMangoRepo() {
  return ensureGitRepo()
    .then(() => getMangoAddress());
}

function setMango(address) {
  mkdirp('.mango/issues', err => {
    if (err) {
      console.error(err);
      return;
    } else {
      fs.writeFile('.mango/contract', address, err => {
        if (err) {
          console.error(err);
          return;
        } else {
          console.log('Wrote contract address to .mango/contract');
        }
      });
    }
  });
}

function getAccount() {
  const { host, port } = argv;

  const provider = new Web3.providers.HttpProvider(`http:\/\/${host}:${port}`);
  const web3 = new Web3(provider);

  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(accounts[0]);
      }
    });
  });
}

function mangoInit(account) {
  console.log('Creating new Mango repository with maintainer: ' + account);

  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, null, account);

  return mangoRepoLib.init()
    .then(address => {
      console.log('Mango repository created: ' + address);
      setMango(address);
      return address;
    }).catch(err => console.error(err));
}

function mangoStatus(mangoAddress, account) {
  console.log('Mango repository at ' + mangoAddress);

  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.refs()
    .then(refs => {
      if (refs.length === 0) {
        console.log('No references');
      } else {
        refs.map(ref => {
          console.log('Reference: ' + ref.name + ' -> ' + ref.ref);
        });
      }
    })
    .then(() => mangoRepoLib.snapshots())
    .then(snapshots => {
      if (snapshots.length === 0) {
        console.log('No snapshots');
      } else {
        snapshots.map((snapshot, i) => {
          console.log('Snapshot #' + i + ' -> ' + snapshot);
        });
      }
    });
}

function mangoIssues(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.issues().then(issues => {
    let noIssues = true;

    issues.map((issue, id) => {
      if (issue) {
        noIssues = false;
        console.log('Issue #' + id + ' -> ' + issue);
      }
    });

    if (noIssues) {
      console.log('No issues');
    }
  });
}

function mangoGetIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.getIssue(id)
    .then(hash => swarm.download(hash))
    .then(buf => console.log(buf.toString()));
  }

function mangoNewIssue(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.issueCount()
    .then(count => {
      const id = count.toNumber();

      return editor.edit(ISSUES_DIR + id + '.txt')
        .then(buf => swarm.upload(buf))
        .then(hash => mangoRepoLib.newIssue(hash))
        .then(hash => console.log('[new] Issue #' + id + ' -> ' + hash));
      });
}

function mangoEditIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.getIssue(id)
    .then(hash => swarm.download(hash))
    .then(buf => editor.edit(ISSUES_DIR + id + '.txt', buf.toString()))
    .then(buf => swarm.upload(buf))
    .then(hash => mangoRepoLib.setIssue(id, hash))
    .then(hash => console.log('[edit] Issue #' + id + ' -> ' + hash));
}

function mangoDeleteIssue(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);
  const editor = new IssueEditor();

  return mangoRepoLib.deleteIssue(id)
    .then(id => console.log('[delete] Issue #' + id));
}

function mangoFork() {
  console.log('Forking Mango repository...');

  const { path } = argv;

  const forkIgnore = [
    '.mango',
    'node_modules',
  ];

  const filter = name => {
    return forkIgnore.reduce((acc, file) => {
      return acc && !~name.indexOf(file);
    }, true);
  };

  fs.copy('.', path, {filter: filter}, err => {
    if (err) {
      console.error(err);
    } else {
      console.log('Mango repository forked to ' + path);
    }
  });
}

function mangoMergeFork() {
  console.log('Merging fork into Mango repository...');

  const { path } = argv;

  if (shell.exec('git remote add fork ' + path).code !== 0) {
    shell.echo('Error: Git remote add failed');
    shell.exit(1);
  }

  if (shell.exec('git fetch fork').code !== 0) {
    shell.echo('Error: Git fetch failed');
    shell.exit(1);
  }

  if (shell.exec('git merge --no-ff --no-commit --allow-unrelated-histories fork/master').code !== 0) {
    shell.echo('Error: Git merge failed');
    shell.exit(1);
  }

  if (shell.exec('git reset HEAD .mango').code !== 0) {
    shell.echo('Error: Git reset failed');
    shell.exit(1);
  }

  if (shell.exec('git checkout -- .mango').code !== 0) {
    shell.echo('Error: Git checkout failed');
    shell.exit(1);
  }

  if (shell.exec('git commit -m \"merged fork/master\"').code !== 0) {
    shell.echo('Error: Git commit failed');
    shell.exit(1);
  }

  if (shell.exec('git remote rm fork').code !== 0) {
    shell.echo('Error: Git remote rm failed');
    shell.exit(1);
  }

  console.log('Fork merged into Mango repository.');
}

function mangoPullRequests(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.pullRequests()
    .then(pullRequests => {
      let noPullRequests = true;

      pullRequests.map((pullRequest, i) => {
        if (pullRequest != '0x0000000000000000000000000000000000000000') {
          noPullRequests = false;
          console.log('Pull Request #' + i + ' -> ' + pullRequest);
        }
      });

      if (noPullRequests) {
        console.log('No pull requests');
      }
    });
}

function mangoGetPullRequest(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.getPullRequest(id)
    .then(forkAddress => console.log('Pull Request #' + id + ' -> ' + forkAddress));
}

function mangoOpenPullRequest(mangoAddress, account) {
  const { host, port, issueId, forkAddress } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.openPullRequest(issueId, forkAddress)
    .then(id => console.log('[opened] Pull Request #' + id + ' for issue #' + issueId + ' -> ' + forkAddress));
}

function mangoClosePullRequest(mangoAddress, account) {
  const { host, port, id } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.closePullRequest(id)
    .then(id => console.log('[closed] Pull Request #' + id));
}

function mangoMaintainers(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.maintainers()
    .then(maintainers => {
      maintainers.map(maintainer => {
        if (maintainer != '0x0000000000000000000000000000000000000000') {
          console.log(maintainer);
        }
      });
    });
}

function mangoAddMaintainer(mangoAddress, account) {
  const { host, port, address } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.addMaintainer(address)
    .then(address => console.log('[added] Maintainer ' + address));
}

function mangoRemoveMaintainer(mangoAddress, account) {
  const { host, port, address } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.removeMaintainer(address)
    .then(address => console.log('[removed] Maintainer ' + address));
}

function mangoSetObsolete(mangoAddress, account) {
  const { host, port } = argv;

  const mangoRepoLib = initLib(host, port, mangoAddress, account);

  return mangoRepoLib.setObsolete()
    .then(address => console.log('[obsolete] Mango repository ' + address));
}




/**
 * Initialize an OpenCollab repo at a specified directory path
 * @param {string} directory 
 */
export function init(directory) {
  return ensureGitRepo(directory)
          .then(() => getAccount())
          .then(account => mangoInit(account))
}