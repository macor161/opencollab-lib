let assert = require('assert')
let opencollab = require('../public/index')
let fs = require('fs-extra')
let { expect } = require('chai')

describe('issues', () => {
   
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => done())
  }) 


  it("should throw if no .git folder is found", done => {
    fs.mkdirp('test/tmp/issues1')
    .then(() => opencollab.issues('test/tmp/issues1', 'test123432\n'))
    .then(() => {
        assert.fail()
        done()
    })
    .catch(e => {
        done()
    })        
  })

  it("should throw if the OpenCollab repo is not initialized", done => {
    fs.mkdirp('test/tmp/issues2/.git')
    .then(() => opencollab.issues('test/tmp/issues2', 'test123432\n'))
    .then(() => {
      assert.fail()
      done()
    })
    .catch(e => {
        done()
    })     
  }) 

  it("should return an array of issues", done => {
    fs.mkdirp('test/tmp/issues3/.git')
    .then(() => opencollab.init('test/tmp/issues3', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.newIssue('test/tmp/issues3', 'test123432\n'))    
    .then(() => opencollab.issues('test/tmp/issues3'))
    .then(issues => {
        expect(issues).to.be.a('Array')
        expect(issues.length).to.equal(1)
        done()
    })
    .catch(e => {
        assert.fail()
        done()
    })        
  })
   
})