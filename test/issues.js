const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const { expect } = require('chai')

describe('issues', () => {
   
  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')
  }) 


  it("should throw if no .git folder is found", async () => {
    try {
      await fs.mkdirp('test/tmp/issues1')
      
      const repo = new OpenCollab('test/tmp/issues1')

      await repo.issues('test123432\n')
      
      assert.fail()
    } catch(e) {   }     
  })

  it("should throw if the OpenCollab repo is not initialized", async () => {

    try {
      await fs.mkdirp('test/tmp/issues2/.git')

      const repo = new OpenCollab('test/tmp/issues2')

      await repo.issues('test123432\n')
      
      assert.fail()
    } catch(e) {  }    
  }) 

  it("should return an array of issues", async() => {
    try {
      await fs.mkdirp('test/tmp/issues3/.git')

      const repo = new OpenCollab('test/tmp/issues3')

      await repo.init('test/tmp/issues3', { name: 'test repo', description: 'this is description' })

      await repo.newIssue('test/tmp/issues3', 'issue name', 'issue desc', 'test123432\n')
      const issues = await repo.issues('test/tmp/issues3')

      expect(issues).to.be.a('Array')
      expect(issues.length).to.equal(1)

    } catch(e) {
        console.log(e)
        assert.fail()
    }       
  })
   
})