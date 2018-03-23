const assert = require('assert')
const opencollab = require('../index')
const fs = require('fs-extra')
const chai = require('chai')

chai.use(require('chai-string'))

var { expect } = chai


describe('status', () => {

    before(async () => {
        await fs.remove('test/tmp')
        await fs.mkdirp('test/tmp')
    })
    
    it("should return status info", async () => {
        const name = 'test name'
        const description = 'test description'

        await fs.mkdirp('test/tmp/status1/.git')
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