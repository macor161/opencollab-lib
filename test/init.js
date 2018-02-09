var assert = require('assert')
var opencollab = require('../public/index')
var fs = require('fs-extra')
var chai = require('chai')

chai.use(require('chai-string'))

var { expect } = chai


describe('init', () => {

    it("should return the mango address", done => {
        fs.remove('test/tmp')
        .then(() => fs.mkdirp('test/tmp/init1/.git'))
        .then(() => opencollab.init('test/tmp/init1'))        
        .then(result => {
            
            expect(result).to.be.a('string')
            expect(result).to.startsWith('0x')

            done()
        })
        .catch(e => {
            assert.fail()
            done()
        })        
    })

    
    it("should throw if no git repository is found", done => {
        fs.rmdir('test/tmp')
        .then(() => fs.mkdirp('test/tmp/init-no-git'))
        .then(() => opencollab.init('test/tmp/init-no-git'))        
        .then(result => {
            assert.fail()
            done()
        })
        .catch(e => {         
            done()
        })
    })

    
})