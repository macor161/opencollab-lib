let assert = require('assert')
let { expect } = require('chai')
//let IPFS = require('ipfs')

//let ipfs = new IPFS()

describe('status', () => {

    before(done => {
        setTimeout(done, 2000)
    })
    
    xit("", done => {
        ipfs.object.put({ Data: 'toto', Links: [] })
        .then(l => {
            console.log('good ', l.toJSON())
            console.log('hash: ', l.toJSON().multihash)   
            return l.toJSON().multihash   
        })
        .then(hash => {
            return ipfs.object.get(hash)
        })
        .then(data => {
            console.log('get data: ', data.toJSON())
            console.log(data.toJSON().data.toString())
        })
        .catch(e => {
            console.log('error: ', e)
            done()
        })
        
    })


})

