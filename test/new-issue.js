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
    .then(() => opencollab.newIssue('test/tmp/new-issue1', 'issue name', 'issue description', 'test123432\n'))
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
    .then(() => opencollab.newIssue('test/tmp/new-issue2', 'issue name', 'issue description', 'test123432\n'))
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
    .then(() => opencollab.newIssue('test/tmp/new-issue3', 'issue name', 'issue description', 'test123432\n'))
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
  
  it("should create the issue with the right name, description and content", done => {
    const name = 'Issue name'
    const desc = 'Issue description.'
    const content = 'Content\ntest test'

    fs.mkdirp('test/tmp/new-issue4/.git')
    .then(() => opencollab.init('test/tmp/new-issue4', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.newIssue('test/tmp/new-issue4', name, desc, content ))
    .then(() => opencollab.getIssue('test/tmp/new-issue4', 0))
    .then(issue => {
        expect(issue.name).to.equal(name)
        expect(issue.description).to.equal(desc)
        expect(issue.content).to.equal(content)
        done()
    })
    .catch(e => {
      console.log('Error: ', e)
        assert.fail()
        done()
    })        
  })    

   
})