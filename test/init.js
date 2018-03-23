let assert = require('assert')
let OpenCollab = require('../index')
let fs = require('fs-extra')
let chai = require('chai')

chai.use(require('chai-string'))

let { expect } = chai


describe('init', () => {

    before(async () => {
        await fs.remove('test/tmp')
        await fs.mkdirp('test/tmp')
    })    

    it("should return the mango address", async () => {

        const repoPath = 'test/tmp/init1'

        try {
            await fs.mkdirp(`${repoPath}/.git`)
            const repo = new OpenCollab(repoPath)
            const result = await repo.init({ name: 'test repo', description: 'this is description' }) 

            expect(result).to.be.a('string')
            expect(result).to.startWith('0x')

        } catch(e) {
            console.log(e)
            assert.fail()
        }    
    })

    
    it("should throw if no git repository is found", async () => {
        const repoPath = 'test/tmp/init-no-git'

        try {
            await fs.mkdirp(repoPath)
            const repo = new OpenCollab(repoPath)
            const result = await repo.init()
            
            assert.fail()
        }
        catch(e) {         
            
        }
    })

    
})