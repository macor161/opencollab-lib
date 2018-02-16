let assert = require('assert')
let opencollab = require('../public/index')
let fs = require('fs-extra')
let { expect } = require('chai')


describe('getIssue', () => {
    
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => done())
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
    .then(() => opencollab.init('test/tmp/get-issue3', 'test repo for new issue', "description"))    
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
    fs.mkdirp('test/tmp/get-issue4/.git')
    .then(() => opencollab.init('test/tmp/get-issue4', 'test repo for new issue', "description"))    
    .then(() => opencollab.newIssue('test/tmp/get-issue4', 'test123432\n'))    
    .then(() => opencollab.getIssue('test/tmp/get-issue4', 0))
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