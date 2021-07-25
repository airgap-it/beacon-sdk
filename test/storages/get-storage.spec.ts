import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'
import sinon from 'sinon'

import { ChromeStorage, getStorage, LocalStorage } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`Storage`, () => {
  it(`should not get a storage by default`, async () => {
    try {
      const storage = await getStorage()
      expect(storage).to.be.undefined
    } catch (e) {
      expect(e.message).to.equal('no storage type supported')
    }
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
