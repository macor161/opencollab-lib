var assert = require('assert')
var opencollab = require('../public/index')
let fs = require('fs-extra')
let { expect } = require('chai')

describe('newIssue', () => {
    
  it("should return the issue", done => {
    fs.mkdirp('test/tmp/new-issue1/.git')
    .then(() => opencollab.init('test/tmp/new-issue1', 'test repo for new issue', "description"))    
    .then(() => opencollab.newIssue('test/tmp/new-issue1', 'test123432\n'))
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