const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const { expect } = require('chai')


describe('updateIssue', () => {
    
  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')
  }) 

  it("should return the new hash for the issue", async () => {
    try {
      await fs.mkdirp('test/tmp/update-issue4/.git')

      const repo = new OpenCollab('test/tmp/update-issue4')

      await opencollab.init({ name: 'test repo', description: 'description' })   
      await opencollab.newIssue('name', 'description', 'test\n')
      const issue = await repo.updateIssue('test/tmp/update-issue4', 0, 'test updated\n')

      expect(issue).to.be.a('string')

    } catch(e) {
        console.log(e)
        assert.fail()
    }      
  })
   
})