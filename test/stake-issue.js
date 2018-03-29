const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const { expect } = require('chai')

describe('stakeIssue', () => {

  
  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')
  })
    
  
  xit("should not throw an error", async () => {
    try {
      const name = 'Issue name'
      const desc = 'Issue description.'
      const content = 'Content\ntest test'

      await fs.mkdirp('test/tmp/stake-issue1/.git')

      const repo = new OpenCollab('test/tmp/stake-issue1')

      await repo.init({ name: 'test repo', description: 'this is description' })   
      await repo.newIssue(name, desc, content )
      const result = await repo.stakeIssue(0, 5)
      console.log('result: ', result)
    } catch(e) {
      console.log('Error: ', e)
      assert.fail()
    }       
  })    

   
})