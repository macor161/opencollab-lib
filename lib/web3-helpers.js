/**
 * Returns the first account available from
 * a web3 instance
 * @param {Web3} web3 
 */
function getDefaultAccount(web3) {
  
    return new Promise((resolve, reject) => {
      web3.eth.getAccounts((err, accounts) => {
        if (err != null) {
          reject(err)
        } else {
          resolve(accounts[0])
        }
      })
    })
  }


module.exports = {
    getDefaultAccount
}