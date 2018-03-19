let assert = require('assert')
let opencollab = require('../index')
let fs = require('fs-extra')
let { expect } = require('chai')

describe('stakeIssue', () => {

  
  before(done => {
    fs.remove('test/tmp')
    .then(() => fs.mkdirp('test/tmp'))
    .then(() => setTimeout(done, 2000))
  })
    
  
  xit("should not throw an error", done => {
    const name = 'Issue name'
    const desc = 'Issue description.'
    const content = 'Content\ntest test'

    fs.mkdirp('test/tmp/stake-issue1/.git')
    .then(() => opencollab.init('test/tmp/stake-issue1', { name: 'test repo', description: 'this is description' }))    
    .then(() => opencollab.newIssue('test/tmp/stake-issue1', name, desc, content ))
    .then(() => opencollab.stakeIssue('test/tmp/stake-issue1', 0, 5))
    .then(result => {
        //expect(result).to.equal(true)
        console.log('result: ', result)
        done()
    })
    .catch(e => {
      console.log('Error: ', e)
        assert.fail()
        done()
    })        
  })    

   
})