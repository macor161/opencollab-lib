const assert = require('assert')
const OpenCollab = require('../index')
const fs = require('fs-extra')
const chai = require('chai')

chai.use(require('chai-string'))

var { expect } = chai


describe('status', () => {

  before(async () => {
    await fs.remove('test/tmp')
    await fs.mkdirp('test/tmp')
  })

  it("should return status info", async () => {
    try {
      const name = 'test name'
      const description = 'test description'

      await fs.mkdirp('test/tmp/status1/.git')

      const repo = new OpenCollab('test/tmp/status1')
      await repo.init({ name, description })
      const status = await repo.status()

      expect(status.name).to.equal(name)
      expect(status.description).to.equal(description)
      expect(status.mangoAddress).to.startWith('0x')
      expect(status.references).to.be.a('Array')
      expect(status.snapshots).to.be.a('Array')

    } catch (e) {
      console.log('error: ', e)
      assert.fail()
    }
  })


  it("should throw if no git repository is found", async () => {
    try {
      await fs.mkdirp('test/tmp/status-no-git')
      const result = await opencollab.status()
      
      assert.fail()
    } catch(e) {
    }
  })


})