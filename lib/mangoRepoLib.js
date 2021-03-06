module.exports = class MangoRepoLib {
  constructor(MangoRepo, mangoAddress, provider, fromAddress) {
    this.provider = provider;
    this.fromAddress = fromAddress;

    MangoRepo.setProvider(this.provider);

    this.mangoRepoArtifact = MangoRepo;

    if (mangoAddress) {
      this.mangoRepo = this.mangoRepoArtifact.at(mangoAddress);
    }
  }

  init(opts) {
    return this.mangoRepoArtifact.new(
        opts.name, 
        opts.description,
        opts.maintainerPercentage,
        opts.voterRewardPercentage, 
        opts.voterPenaltyPercentage,
        opts.voterDeposit,
        opts.maintainerStake,
        opts.contributorStake,
        opts.challengerStake,
        opts.reviewPeriodLength,
        opts.votingCommitPeriodLength,
        opts.votingRevealPeriodLength,
        opts.tokenCount, {from: this.fromAddress, gas: 10000000})
      .then(instance => {
        this.mangoRepo = instance
        return this.mangoRepo.address
    })
  }

  getName() {
    return this.mangoRepo.getName()
  }

  getDescription() {
    return this.mangoRepo.getDescription()
  }  

  refNames() {
    return this.mangoRepo.refCount().then(count => {
      let names = [...Array(count.toNumber()).keys()].map(i => {
        return this.mangoRepo.refName(i);
      });

      return Promise.all(names);
    });
  }

  refs() {
    return this.refNames().then(names => {
      let refs = names.map(name => {
        return this.mangoRepo.getRef(name);
      });

      return Promise.all(refs).then(refs => {
        return names.map((name, i) => {
          return {
            name,
            ref: refs[i]
          };
        });
      });
    });
  }

  snapshots() {
    return this.mangoRepo.snapshotCount().then(count => {
      let snapshots = [...Array(count.toNumber()).keys()].map(i => {
        return this.mangoRepo.getSnapshot(i);
      });

      return Promise.all(snapshots);
    });
  }

  issueCount() {
    return this.mangoRepo.issueCount();
  }

  issues() {
    return this.issueCount()
      .then(count => {
        let issues = [...Array(count.toNumber()).keys()].map(i => {
          return this.mangoRepo.getIssue(i);
        });

        return Promise.all(issues);
      });
  }

  getIssue(id) {
    return this.mangoRepo.getIssue(id);
  }

  newIssue(name, description, hash, isActive = true) {
    return this.mangoRepo.newIssue(name, description, hash, isActive, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Create issue transaction failed.');
      } else {
        return hash;
      }
    });
  }

  setIssue(id, hash) {
    return this.mangoRepo.setIssue(id, hash, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Set issue transaction failed.');
      } else {
        return hash;
      }
    });
  } 

  stakeIssue(id, stake) {
    return this.mangoRepo.stakeIssue(id, stake, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Stake issue transaction failed.');
      } else {
        return result;
      }
    })
  }  

  deleteIssue(id) {
    return this.mangoRepo.deleteIssue(id, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Delete issue transaction failed.');
      } else {
        return id;
      }
    });
  }

  pullRequests() {
    return this.mangoRepo.pullRequestCount()
      .then(count => {
        let pullRequests = [...Array(count.toNumber()).keys()].map(i => {
          return this.mangoRepo.getPullRequest(i);
        });

        return Promise.all(pullRequests);
      });
  }

  getPullRequest(id) {
    return this.mangoRepo.getPullRequest(id);
  }

  openPullRequest(issueId, forkAddress) {
    return this.mangoRepo.openPullRequest(issueId, forkAddress, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Open PR transaction failed.');
      } else {
        return issueId;
      }
    }).then(() => {
      return this.mangoRepo.pullRequestCount()
        .then(count => count.toNumber() - 1);
    });
  }

  closePullRequest(id) {
    return this.mangoRepo.closePullRequest(id, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Close PR transaction failed.');
      } else {
        return id;
      }
    });
  }

  maintainers() {
    return this.mangoRepo.maintainerCount()
      .then(count => {
        let maintainers = [...Array(count.toNumber()).keys()].map(i => {
          return this.mangoRepo.getMaintainer(i);
        });

        return Promise.all(maintainers);
      });
  }

  addMaintainer(address) {
    return this.mangoRepo.addMaintainer(address, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Add maintainer transaction failed.');
      } else {
        return address;
      }
    });
  }

  removeMaintainer(address) {
    return this.mangoRepo.removeMaintainer(address, {from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Remove maintainer transaction failed.');
      } else {
        return address;
      }
    });
  }

  setObsolete() {
    return this.mangoRepo.setObsolete({from: this.fromAddress, gas: 500000}).then(result => {
      if (result.receipt['gasUsed'] == 500000) {
        throw new Error('Set obsolete transaction failed.');
      } else {
        return this.mangoRepo.address;
      }
    });
  }
}
