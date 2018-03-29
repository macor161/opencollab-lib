const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const { expect } = require('chai')


describe('getIssue', () => {
    
  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')    
  }) 


  it("should throw if no .git folder is found", async () => {
    try {
      await fs.mkdirp('test/tmp/get-issue1')

      const repo = new OpenCollab('test/tmp/get-issue1')

      await opencollab.getIssue(0)

      assert.fail()
    } catch(e) { }        
  })

  it("should throw if the OpenCollab repo is not initialized", async () => {
    try {
      await fs.mkdirp('test/tmp/get-issue2/.git')

      const repo = new OpenCollab('test/tmp/get-issue2/.git')

      await opencollab.getIssue(0)
      assert.fail()
    } catch(e) { }    
  }) 

  it("should throw if issue id does not exist", async () => {
    try {
      await fs.mkdirp('test/tmp/get-issue3/.git')

      const repo = new OpenCollab('test/tmp/get-issue3')
      await repo.init({ name: 'test repo', description: 'this is description' })
      await repo.getIssue(0)   

      assert.fail()
    } catch(e) { }        
  })  

  it("should return the selected issue", async () => {
    try {
      const issueName = 'Issue name 1'
      const issueDesc = 'Issue description 1.'
      const issueContent = 'test123432\n'

      await fs.mkdirp('test/tmp/get-issue4/.git')

      const repo = new OpenCollab('test/tmp/get-issue4')

      await repo.init({ name: 'test repo', description: 'this is description' })  
      await repo.newIssue(issueName, issueDesc, issueContent)
      const issue = await repo.getIssue(0)
      
      expect(issue.name).to.equal(issueName)
      expect(issue.description).to.equal(issueDesc)
      expect(issue.content).to.equal(issueContent)
    } catch(e) {
        console.log(e)
        assert.fail()
    }       
  })
   
})