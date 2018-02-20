let assert = require('assert')
let opencollab = require('../public/index')
let fs = require('fs-extra')
let { expect } = require('chai')


describe('deleteIssue', () => {
    
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => done())
    .catch(e => console.log('Error while deleting tmp folder: ', e))
  }) 

  xit("should remove the issue from the list", done => {
    fs.mkdirp('test/tmp/delete-issue4/.git')
    .then(() => opencollab.init('test/tmp/delete-issue4', { name: 'test repo', description: 'description' }))    
    .then(() => opencollab.newIssue('test/tmp/delete-issue4', 'test\n')) 
    .then(() => opencollab.deleteIssue('test/tmp/delete-issue4', 0))
    .then(() => opencollab.issues('test/tmp/delete-issue4'))
    .then(issues => {
        expect(issues.length).to.equal(0)
        done()
    })
    .catch(e => {
        console.log(e)
        assert.fail()
        done()
    })        
  })
   
})

