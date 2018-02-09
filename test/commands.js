var assert = require('assert')
var opencollab = require('../public/bin/opencollab.js')

describe('init', () => {
    it("should ", () => {
        opencollab.init('./testgit')
        .then(e => {
            console.log(e)
        })
        .catch(e => {
            console.log(e)
            assert.fail()
        })

    })
})