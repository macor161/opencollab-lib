var assert = require('assert')
var opencollab = require('../public/index')
let { expect } = require('chai')


describe('getIssue', () => {
    
  it("should return the issue", done => {
    //opencollab.getIssue('test/data/issues1', '0x0a2a7c6294af92ebd7c944103db150dcc4f044e6b303fbaf53668cfad2265b17')
    opencollab.getIssue('test/tmp/new-issue1', 0)
    .then(issue => {
        console.log(issue)
        done()
    })
    .catch(e => {
        assert.fail()
        done()
    })        
  })
   
})