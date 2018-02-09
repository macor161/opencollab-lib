var assert = require('assert')
var opencollab = require('../public/index')
var fs = require('fs-extra')

describe('status', () => {
    
    it("should return status info", done => {
        fs.mkdirp('test/data/status1/.git')
        .then(() => opencollab.status('test/data/status1'))
        .then(result => {
            console.log(result)

            done()
        })
        .catch(e => {
            assert.fail()
            done()
        })        
    })

    
    xit("should throw if no git repository is found", done => {
        fs.rmdir('test/tmp')
        .then(() => fs.mkdirp('test/tmp/status-no-git'))
        .then(() => opencollab.status('test/tmp/status-no-git'))        
        .then(result => {
            assert.fail()
            done()
        })
        .catch(e => {         
            done()
        })
    })

    
})