let assert = require('assert')
let opencollab = require('../index')
let fs = require('fs-extra')
let { expect } = require('chai')

describe('newIssue', () => {

  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => setTimeout(done, 3000))
  })
    
  it("should throw if no .git folder is found", done => {
    fs.mkdirp('test/tmp/new-issue1')
    .then(() => opencollab.newIssue('test/tmp/new-issue1', 'test123432\n'))
    .then(() => {
        assert.fail()
        done()
    })
    .catch(e => {
        done()
    })        
  })

  it("should throw if the OpenCollab repo is not initialized", done => {
    fs.mkdirp('test/tmp/new-issue2/.git')
    .then(() => opencollab.newIssue('test/tmp/new-issue2', 'test123432\n'))
    .then(() => {
      assert.fail()
      done()
    })
    .catch(e => {
        done()
    })     
  })  

  it("should create exactly one new issue", done => {
    fs.mkdirp('test/tmp/new-issue3/.git')
    .then(() => opencollab.init('test/tmp/new-issue3', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.newIssue('test/tmp/new-issue3', 'test123432\n'))
    .then(() => opencollab.issues('test/tmp/new-issue3'))
    .then(issues => {
        expect(issues.length).to.equal(1)
        done()
    })
    .catch(e => {
        assert.fail()
        done()
    })        
  })    
   
})