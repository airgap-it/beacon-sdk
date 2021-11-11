import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { ChromeStorage, getStorage, LocalStorage } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`Storage`, () => {
  it(`should get a storage by default`, async () => {
    const storage = await getStorage()
    console.log('STORAGE', storage)
    expect(storage).to.not.be.undefined
  })

  it(`should get the ChromeStorage`, async () => {
    sinon.stub(ChromeStorage, 'isSupported').callsFake(() => Promise.resolve(true))
    const storage = await getStorage()
    sinon.restore()
    expect(storage instanceof ChromeStorage).to.be.true
  })

  it(`should get the LocalStorage`, async () => {
    sinon.stub(LocalStorage, 'isSupported').callsFake(() => Promise.resolve(true))
    const storage = await getStorage()
    sinon.restore()
    expect(storage instanceof LocalStorage).to.be.true
  })
})
