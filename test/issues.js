var assert = require('assert')
var opencollab = require('../public/index')
let { expect } = require('chai')

describe('issues', () => {
    
  it("should return an array of issues", done => {
    opencollab.issues('test/data/issues1')
    .then(issues => {
        expect(issues).to.be.a('Array')
        done()
    })
    .catch(e => {
        assert.fail()
        done()
    })        
  })
   
})