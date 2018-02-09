var assert = require('assert')
var opencollab = require('../public/index')
var fs = require('fs-extra')

describe('init', () => {
    it("should return the mango address", done => {
        fs.remove('tmp')
        .then(() => fs.mkdirp('tmp/init1/.git'))
        .then(() => opencollab.init('tmp/init1'))        
        .then(result => {
            if (!result || !result.indexOf || result.indexOf('0x') !== 0)
                done(assert.fail())

            done()
        })
        .catch(e => {
            assert.fail()
            done()
        })        
    })

    
    it("should throw if no git repository is found", done => {
        fs.rmdir('tmp')
        .then(() => fs.mkdirp('tmp/init-no-git'))
        .then(() => opencollab.init('tmp/init-no-git'))        
        .then(result => {
            assert.fail()
            done()
        })
        .catch(e => {         
            done()
        })
    })
})