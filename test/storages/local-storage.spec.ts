import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { LocalStorage, StorageKey } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`LocalStorage`, () => {
  let getSpy: sinon.SinonSpy<any[], any>
  let setSpy: sinon.SinonSpy<any[], any>
  let deleteSpy: sinon.SinonSpy<any[], any>

  beforeEach(() => {
    sinon.restore()
    getSpy = sinon.spy(localStorage, 'getItem')
    setSpy = sinon.spy(localStorage, 'setItem')
    deleteSpy = sinon.spy(localStorage, 'removeItem')
  })

  it(`should not be supported`, async () => {
    const isSupported = await LocalStorage.isSupported()
    expect(isSupported).to.be.false
  })

  it(`should be supported`, async () => {
    const windowRef = globalThis.window

    globalThis.window = {
      localStorage: {} as any
    } as any

    const isSupported = await LocalStorage.isSupported()

    globalThis.window = windowRef

    expect(isSupported).to.be.true
  })

  it(`should write a value to the storage`, async () => {
    const storage = new LocalStorage()

    const testValue = 'test-version'

    await storage.set(StorageKey.BEACON_SDK_VERSION, testValue)

    expect(setSpy.firstCall.args[0]).to.deep.equal(StorageKey.BEACON_SDK_VERSION)
    expect(setSpy.firstCall.args[1]).to.deep.equal(testValue)
    expect(setSpy.callCount).to.equal(1)
  })

  it(`should delete a value to the storage`, async () => {
    const storage = new LocalStorage()

    await storage.delete(StorageKey.BEACON_SDK_VERSION)

    expect(deleteSpy.firstCall.args[0]).to.deep.equal(StorageKey.BEACON_SDK_VERSION)
    expect(deleteSpy.callCount).to.equal(1)
  })

  it(`should read a default value from the storage`, async () => {
    const storage = new LocalStorage()

    const valueVersion = await storage.get(StorageKey.BEACON_SDK_VERSION)

    expect(valueVersion).to.be.undefined
    expect(getSpy.firstCall.args[0]).to.equal(StorageKey.BEACON_SDK_VERSION)
    expect(getSpy.callCount).to.equal(1)

    const valueAccounts = await storage.get(StorageKey.ACCOUNTS)

    expect(valueAccounts).to.deep.equal([])
    expect(getSpy.secondCall.args[0]).to.equal(StorageKey.ACCOUNTS)
    expect(getSpy.callCount).to.equal(2)
  })

  it(`should read a value from the storage`, async () => {
    const storage = new LocalStorage()

    const testValue = 'test-version1'

    localStorage.setItem(StorageKey.BEACON_SDK_VERSION, testValue)

    const value = await storage.get(StorageKey.BEACON_SDK_VERSION)

    expect(value).to.equal(testValue)
    expect(getSpy.firstCall.args[0]).to.equal(StorageKey.BEACON_SDK_VERSION)
    expect(getSpy.callCount).to.equal(1)
  })
})
