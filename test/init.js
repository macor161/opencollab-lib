let assert = require('assert')
let opencollab = require('../index')
let fs = require('fs-extra')
let chai = require('chai')

chai.use(require('chai-string'))

let { expect } = chai


describe('init', () => {

    before(done => {
        fs.remove('test/tmp')
        .then(() => fs.mkdirp('test/tmp'))
        .then(() => done())
    })    

    it("should return the mango address", done => {
        fs.mkdirp('test/tmp/init1/.git')
        .then(() => opencollab.init('test/tmp/init1', { name: 'test repo', description: 'this is description' }))        
        .then(result => {
            
            expect(result).to.be.a('string')
            expect(result).to.startWith('0x')

            done()
        })
        .catch(e => {
            console.log(e)
            assert.fail()
            done()
        })        
    })

    
    it("should throw if no git repository is found", done => {
        fs.mkdirp('test/tmp/init-no-git')
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