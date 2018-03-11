let assert = require('assert')
let opencollab = require('../index')
let fs = require('fs-extra')
let { expect } = require('chai')


describe('getIssue', () => {
    
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => setTimeout(done, 3000))
  }) 


  it("should throw if no .git folder is found", done => {
    fs.mkdirp('test/tmp/get-issue1')
    .then(() => opencollab.getIssue('test/tmp/get-issue1', 0))
    .then(() => {
        assert.fail()
        done()
    })
    .catch(e => {
        done()
    })        
  })

  it("should throw if the OpenCollab repo is not initialized", done => {
    fs.mkdirp('test/tmp/get-issue2/.git')
    .then(() => opencollab.getIssue('test/tmp/get-issue2', 0))
    .then(() => {
      assert.fail()
      done()
    })
    .catch(e => {
        done()
    })     
  }) 

  it("should throw if issue id does not exist", done => {
    fs.mkdirp('test/tmp/get-issue3/.git')
    .then(() => opencollab.init('test/tmp/get-issue3', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.getIssue('test/tmp/get-issue3', 0))    
    .then(() => {        
      assert.fail()
      done()
    })
    .catch(e => {
        done()
    })        
  })  

  it("should return the selected issue", done => {
    const issueName = 'Issue name 1'
    const issueDesc = 'Issue description 1.'
    const issueContent = 'test123432\n'

    fs.mkdirp('test/tmp/get-issue4/.git')
    .then(() => opencollab.init('test/tmp/get-issue4', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.newIssue('test/tmp/get-issue4', issueName, issueDesc, issueContent))    
    .then(() => opencollab.getIssue('test/tmp/get-issue4', 0))
    .then(issue => {
      expect(issue.name).to.equal(issueName)
      expect(issue.description).to.equal(issueDesc)
      expect(issue.content).to.equal(issueContent)
      done()
    })
    .catch(e => {
        console.log(e)
        assert.fail()
        done()
    })        
  })
   
})