var assert = require('assert')
var opencollab = require('../public/bin/opencollab.js')
var fs = require('fs-extra')

describe('init', () => {
    it("should return the mango address", done => {
        // TODO
    })


    it("should throw if no git repository is found", done => {
        fs.rmdir('tmp')
        .then(() => fs.mkdirp('tmp/init-no-git'))
        .then(() => opencollab.init('tmp/init-no-git'))        
        .then(e => {
            assert.fail()
            done()
        })
        .catch(e => {
            console.log(e)            
            done()
        })
    })
})