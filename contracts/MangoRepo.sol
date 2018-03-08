/*
 * Mango Repository
 * Copyright (C) 2016 Alex Beregszaszi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License only.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
pragma solidity ^0.4.6;


import "./OpenCollabToken.sol";
import "./SafeMath.sol";



contract MangoRepo is SafeMath {
  bool public obsolete;

  string public name;
  string public description;

  // Token address
  OpenCollabToken public token;

  // Maintainer percentage of issue token reward
  uint256 public maintainerPercentage;
  // Percentage to increase voter deposit by if voter is on winning side of vote
  uint256 public voterRewardPercentage;
  // Percentage to decrease voter deposity by if voter is on losing side of vote
  uint256 public voterPenaltyPercentage;

  // Required deposit to be a voter
  uint256 public voterDeposit;
  // Required stake to be a contributor and open a pull request
  uint256 public contributorStake;
  // Required stake to initiate a pull request merge
  uint256 public maintainerStake;
  // Required stake to challenge a maintainer
  uint256 public challengerStake;

  // Protocol period
  enum Period { Review, Voting, Regular }
  // Current protocol period
  Period currentPeriod;

  // Length of maintainer merge review period in days
  uint256 public reviewPeriodLength;
  // Timestamp for end of review period
  uint256 public reviewPeriodEnd;
  // Length of voting commit period
  uint256 public votingCommitPeriodLength;
  // Timestamp for end of voting commit period in days
  uint256 public votingCommitPeriodEnd;
  // Length of voting reveal period in days
  uint256 public votingRevealPeriodLength;
  // Timestamp for end of voting reveal period
  uint256 public votingRevealPeriodEnd;  

  address[] maintainerAddresses;
  mapping (address => bool) maintainers;

  string[] refKeys;
  mapping (string => string) refs;

  string[] snapshots;


  struct Issue {
    uint id;                                 // Issue id
    address creator;                         // Address of issue creator
    string hash;                             // Swarm hash of issue contents
    uint totalStake;                         // Total amount staked to this issue
    mapping (address => uint) stakedTokens;  // Mapping curator addresses to staked amounts for this issue
    bool openPullRequest;                    // Is there a pull request open for this issue
    uint pullRequestId;                      // Id for open pull request for this issue
    bool active;                             // Is this issue active
  }


  struct PullRequest {
    uint id;                                 // Pull request id
    Issue issue;                             // Issue being resolved
    address creator;                         // Address of pull request creator
    address fork;                            // Contract address of repo fork
    bool active;                             // Is this pull request active
  }

  // Represents a challenge voting round
  struct VotingRound {
    address maintainer;               // Address of maintainer challenged
    address challenger;               // Address of challenger
    uint256 uphold;                   // Number of uphold votes
    uint256 veto;                     // Number of veto votes
    mapping (address => Vote) votes;  // Votes casted
    VoteValue result;                 // Result of vote
  }

  // Track all voting rounds
  VotingRound[] votingRounds;

  // Represents a vote
  struct Vote {
    bytes32 commit;                   // Vote commitment hash
    VoteValue voteValue;              // Revealed vote value
    bool commited;                    // Was the vote committed
    bool revealed;                    // Was the vote revealed
  }

  // Values of votes
  enum VoteValue { Uphold, Veto, None }

  // Represents a voter
  struct Voter {
    address voterAddress;             // Address of voter
    uint deposit;                     // Voter deposit
    uint lastCheckIn;                 // Last voting round voter checked in
    bool active;                 // Is the voter active
  }

  // Track registered voters
  mapping (address => Voter) public voters;

  // Track stakes for pull requests (opening, merging and challenging)
  mapping (address => uint256) public pullRequestStakes;

  Issue[] issues;
  PullRequest[] pullRequests;

  // Only maintainer can call functions with this modifier
  modifier maintainerOnly {
    if (!maintainers[msg.sender]) throw;
    _;
  }

  // Checks for valid issue
  modifier validIssue(uint id) {
    // Check for valid issue id
    if (id >= issues.length || id < 0) throw;
    // Check for active issue
    if (!issues[id].active) throw;
    _;
  }  

  // Checks for valid pull request
  modifier validPullRequest(uint id) {
    // Check for valid pull request id
    if (id >= pullRequests.length || id < 0) throw;
    // Check for active pull request
    if (!pullRequests[id].active) throw;
    _;
  }

  // Only an issue creator or a maintainer can call functions with this modifier
  modifier issuePermissions(uint id) {
    if (issues[id].creator != msg.sender && !maintainers[msg.sender]) throw;
    _;
  }

  // Only a pull request creator or a maintainer can call functions with this modifier
  modifier pullRequestPermissions(uint id) {
    if (pullRequests[id].creator != msg.sender && !maintainers[msg.sender]) throw;
    _;
  }

  function MangoRepo(string _name, string _description, uint _maintainerPercentage, uint _voterRewardPercentage, uint _voterPenaltyPercentage,
    uint _voterDeposit, uint _maintainerStake, uint _contributorStake, uint _challengerStake, uint _reviewPeriodLength, uint _votingCommitPeriodLength,
    uint _votingRevealPeriodLength, uint _tokenCount) {

    name = _name;
    description = _description;

    maintainers[msg.sender] = true;
    maintainerAddresses.push(msg.sender);
    obsolete = false;
    token = new OpenCollabToken(address(this));

    maintainerPercentage = _maintainerPercentage;
    voterRewardPercentage = _voterRewardPercentage;
    voterPenaltyPercentage = _voterPenaltyPercentage;

    voterDeposit = _voterDeposit;
    maintainerStake = _maintainerStake;
    contributorStake = _contributorStake;
    challengerStake = _challengerStake;

    reviewPeriodLength = _reviewPeriodLength;
    votingCommitPeriodLength = _votingCommitPeriodLength;
    votingRevealPeriodLength = _votingRevealPeriodLength;

    // Initial token distribution
    token.mint(msg.sender, _tokenCount);
  }

  function refCount() constant returns (uint) {
    return refKeys.length;
  }

  function refName(uint index) constant returns (string ref) {
    ref = refKeys[index];
  }

  function getRef(string ref) constant returns (string hash) {
    hash = refs[ref];
  }

  function __findRef(string ref) private returns (int) {
    /* Horrible way to add a new key to the list */

    for (var i = 0; i < refKeys.length; i++)
      if (strEqual(refKeys[i], ref))
        return i;

    return -1;
  }


  function setRef(string ref, string hash) maintainerOnly {
    if (__findRef(ref) == -1)
      refKeys.push(ref);

    refs[ref] = hash;
  }

  function deleteRef(string ref) maintainerOnly {
    int pos = __findRef(ref);
    if (pos != -1) {
      // FIXME: shrink the array?
      refKeys[uint(pos)] = "";
    }

    // FIXME: null? string(0)?
    refs[ref] = "";
  }

  function strEqual(string a, string b) private returns (bool) {
    return sha3(a) == sha3(b);
  }

  function snapshotCount() constant returns (uint) {
    return snapshots.length;
  }

  function getSnapshot(uint index) constant returns (string) {
    return snapshots[index];
  }

  function addSnapshot(string hash) maintainerOnly {
    snapshots.push(hash);
  }

  function issueCount() constant returns (uint count) {
    return issues.length;
  }

  function getIssue(uint id) constant returns (string hash) {
    if (id >= issues.length || id < 0) throw;

    if (bytes(issues[id].hash).length == 0) {
      return '';
    } else {
      return issues[id].hash;
    }
  }

  /**
   * Create new issue
   * @param hash Swarm hash of issue contents
   */
  function newIssue(string hash) returns (bool success) {
    Issue memory issue;

    issue.id = issues.length;
    issue.creator = msg.sender;
    issue.hash = hash;
    issue.totalStake = 0;
    issue.openPullRequest = false;
    issue.pullRequestId = 0;
    issue.active = true;

    issues.push(issue);

    return true;
  }

  function setIssue(uint id, string hash) issuePermissions(id) {
    if (id >= issues.length || id < 0) throw;

    issues[id].hash = hash;
  }

  function closeIssue(uint id) validIssue(id) issuePermissions(id) {
    issues[id].active = false;
  }

  /*
   * Stake tokens to an issue as a curator
   * @param id Issue id
   * @param stake The amount of OCT to stake
   */
  function stakeIssue(uint id, uint stake) validIssue(id) returns (bool success) {

    token.transferFrom(msg.sender, this, stake);

    issues[id].stakedTokens[msg.sender] = safeAdd(issues[id].stakedTokens[msg.sender], stake);

    issues[id].totalStake = safeAdd(issues[id].totalStake, stake);

    return true;
  }

  /*
   * Unbond tokens staked to an issue
   * @param id Issue id
   */
  function withdrawIssueStake(uint id) returns (bool success) {

    if (id >= issues.length || id < 0) throw;

    if (issues[id].openPullRequest) throw;
 
    if (issues[id].stakedTokens[msg.sender] == 0) throw;

    token.transfer(msg.sender, issues[id].stakedTokens[msg.sender]);

    delete issues[id].stakedTokens[msg.sender];
  }

  function pullRequestCount() constant returns (uint count) {
    return pullRequests.length;
  }

  function getPullRequest(uint id) constant returns (address fork) {
    if (id >= pullRequests.length || id < 0) throw;

    if (pullRequests[id].fork == address(0)) {
      return address(0);
    } else {
      return pullRequests[id].fork;
    }
  }

  /**
   * Opens pull request
   * @param issueId Issue id
   * @param fork Contract address for repo fork
   */
  function openPullRequest(uint issueId, address fork) validIssue(issueId) {
    // Transfer tokens. This call throws if it fails
    token.transferFrom(msg.sender, this, contributorStake);

    // Update pullRequestStakes for sender
    pullRequestStakes[msg.sender] = safeAdd(pullRequestStakes[msg.sender], contributorStake);

    PullRequest memory pullRequest;

    pullRequest.id = pullRequests.length;
    pullRequest.issue = issues[issueId];
    issues[issueId].openPullRequest = true;
    issues[issueId].pullRequestId = pullRequest.id;
    pullRequest.creator = msg.sender;
    pullRequest.fork = fork;
    pullRequest.active = true;

    pullRequests.push(pullRequest);
  }

  function closePullRequest(uint id) pullRequestPermissions(id) {
    if (id >= pullRequests.length || id < 0) throw;
    if (pullRequests[id].fork == address(0)) throw;

    delete pullRequests[id];
  }

  /*
   * Finalize a pull request merge
   * @param id Pull request id
   */
  function mergePullRequest(uint id) validPullRequest(id) maintainerOnly returns (bool success) {
    // Check if in regular period
    if (currentPeriod == Period.Regular) throw;
    // If in review period check if it is over
    if (currentPeriod == Period.Review
        && block.timestamp < reviewPeriodEnd) {
      throw;
    }
    // If in voting period check if voting reveal period is over
    if (currentPeriod == Period.Voting
        && block.timestamp < votingRevealPeriodEnd) {
      throw;
    }

    var totalStake = pullRequests[id].issue.totalStake;

    // Mint issue reward
    token.mint(this, totalStake);

    // Calculate rewards
    uint256 maintainerReward = (totalStake * maintainerPercentage) / 100;
    uint256 contributorReward = totalStake - maintainerReward;

    // Update pullRequestStakes with rewards
    pullRequestStakes[msg.sender] = safeAdd(pullRequestStakes[msg.sender], maintainerReward);
    pullRequestStakes[pullRequests[id].creator] = safeAdd(pullRequestStakes[pullRequests[id].creator], contributorReward);

    // Zero out issue pull request id
    uint issueId = pullRequests[id].issue.id;
    issues[issueId].openPullRequest = false;
    issues[issueId].pullRequestId = 0;

    delete pullRequests[id];

    currentPeriod = Period.Regular;

    return true;
  }

  function setObsolete() maintainerOnly {
    obsolete = true;
  }

  function maintainerCount() constant returns (uint) {
    return maintainerAddresses.length;
  }

  function __findMaintainer(address addr) private returns (int) {
    for (var i = 0; i < maintainerAddresses.length; i++) {
      if (maintainerAddresses[i] == addr)
        return i;
    }

    return -1;
  }

  function getName() constant returns (string) {
    return name;
  }

  function getDescription() constant returns (string) {
    return description;
  }

  function getMaintainer(uint idx) constant returns (address) {
    return maintainerAddresses[idx];
  }

  function addMaintainer(address addr) maintainerOnly {
    if (maintainers[addr]) throw;

    maintainers[addr] = true;
    maintainerAddresses.push(addr);
  }

  function removeMaintainer(address addr) maintainerOnly {
    if (!maintainers[addr]) throw;

    maintainers[addr] = false;

    int pos = __findMaintainer(addr);

    if (pos != -1) {
      maintainerAddresses[uint(pos)] = address(0);
    }
  }
}
