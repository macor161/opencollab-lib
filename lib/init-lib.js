let MangoRepoLib = require('./mangoRepoLib')
let Web3 = require('web3')
let contract = require('truffle-contract')

let MangoRepoArtifact = require('../build/contracts/MangoRepo.json')

module.exports = function(host, port, mangoAddress, fromAddress) {
  const provider = new Web3.providers.HttpProvider(`http:\/\/${host}:${port}`);
  const MangoRepo = contract(MangoRepoArtifact);

  return new MangoRepoLib(
    MangoRepo,
    mangoAddress,
    provider,
    fromAddress
  )
}
