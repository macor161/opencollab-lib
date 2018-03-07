let assert = require('assert')
let opencollab = require('../index')
let fs = require('fs-extra')
let { expect } = require('chai')


describe('updateIssue', () => {
    
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => setTimeout(done, 3000))
    .catch(e => console.log('Error while deleting tmp folder: ', e))
  }) 

  it("should return the new hash for the issue", done => {
    fs.mkdirp('test/tmp/update-issue4/.git')
    .then(() => opencollab.init('test/tmp/update-issue4', { name: 'test repo', description: 'description' }))    
    .then(() => opencollab.newIssue('test/tmp/update-issue4', 'test\n'))    
    .then(() => opencollab.updateIssue('test/tmp/update-issue4', 0, 'test updated\n'))
    .then(issue => {
        expect(issue).to.be.a('string')
        done()
    })
    .catch(e => {
        console.log(e)
        assert.fail()
        done()
    })        
  })
   
})