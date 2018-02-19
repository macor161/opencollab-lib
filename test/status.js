let assert = require('assert')
let opencollab = require('../public/index')
let fs = require('fs-extra')
var chai = require('chai')

chai.use(require('chai-string'))

var { expect } = chai


describe('status', () => {

    before(done => {
        fs.remove('test/tmp')
        .then(() => fs.mkdirp('test/tmp'))
        .then(() => done())
    })
    
    it("should return status info", done => {
        const name = 'test name'
        const description = 'test description'

        fs.mkdirp('test/tmp/status1/.git')
        .then(() => opencollab.init('test/tmp/status1', { name, description }))
        .then(() => opencollab.status('test/tmp/status1'))
        .then(status => {
            expect(status.name).to.equal(name)
            expect(status.description).to.equal(description)
            expect(status.mangoAddress).to.startWith('0x')
            expect(status.references).to.be.a('Array')
            expect(status.snapshots).to.be.a('Array')

            done()
        })
        .catch(e => {
            console.log('error: ', e)
            assert.fail()
            done()
        })        
    })

    
    it("should throw if no git repository is found", done => {
        fs.mkdirp('test/tmp/status-no-git')
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