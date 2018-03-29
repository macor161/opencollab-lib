const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const { expect } = require('chai')

describe('newIssue', () => {

  
  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')
  })
    
  it("should throw if no .git folder is found", async () => {
    try {
      await fs.mkdirp('test/tmp/new-issue1')

      const repo = new OpenCollab('test/tmp/new-issues1')

      await repo.newIssue('issue name', 'issue description', 'test123432\n')
      
      assert.fail()
    } catch(e) {
    }     
  })

  it("should throw if the OpenCollab repo is not initialized", async () => {
    try {
      await fs.mkdirp('test/tmp/new-issue2/.git')

      const repo = new OpenCollab('test/tmp/new-issue2')
      await repo.newIssue('issue name', 'issue description', 'test123432\n')
      
      assert.fail()
    } catch(e) {
    }     
  })  

  it("should create exactly one new issue", async () => {
    try {
      await fs.mkdirp('test/tmp/new-issue3/.git')

      const repo = new OpenCollab('test/tmp/new-issue3')
      await repo.init({ name: 'test repo', description: 'this is description' })
      await repo.newIssue('issue name', 'issue description', 'test123432\n')
      const issues = await repo.issues()

      expect(issues.length).to.equal(1)

    } catch(e) {
      assert.fail()
      done()
    }      
  })   
  
  it("should create the issue with the right name, description and content", async () => {

    try {
      const name = 'Issue name'
      const desc = 'Issue description.'
      const content = 'Content\ntest test'

      await fs.mkdirp('test/tmp/new-issue4/.git')

      const repo = new OpenCollab('test/tmp/new-issue3')
      await repo.init({ name: 'test repo', description: 'this is description' }) 
      await repo.newIssue(name, desc, content )
      const issue = await repo.getIssue(0)

      expect(issue.name).to.equal(name)
      expect(issue.description).to.equal(desc)
      expect(issue.content).to.equal(content)
    } catch(e) {
      console.log('Error: ', e)
      assert.fail()
    }        
  })    
   
})