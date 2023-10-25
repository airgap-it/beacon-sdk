import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { StorageKey } from '@mavrykdynamics/beacon-types'

import { LocalStorage } from '../../src'

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

  it(`should be supported`, async () => {
    const isSupported = await LocalStorage.isSupported()
    expect(isSupported).to.be.true
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

  it(`should create a storage with a prefix`, async () => {
    const prefix1 = 'prefix1'
    const prefix2 = 'prefix2'

    const storage1 = new LocalStorage(prefix1)
    const storage2 = new LocalStorage(prefix2)
    const storageNoPrefix = new LocalStorage()

    const testValue1 = 'test-version1'
    const testValue2 = 'test-version2'
    const testValueNoPrefix = 'test-version3'

    localStorage.setItem(prefix1 + '-' + StorageKey.BEACON_SDK_VERSION, testValue1)
    localStorage.setItem(prefix2 + '-' + StorageKey.BEACON_SDK_VERSION, testValue2)
    localStorage.setItem(StorageKey.BEACON_SDK_VERSION, testValueNoPrefix)

    const value1 = await storage1.get(StorageKey.BEACON_SDK_VERSION)
    const value2 = await storage2.get(StorageKey.BEACON_SDK_VERSION)
    const valueNoPrefix = await storageNoPrefix.get(StorageKey.BEACON_SDK_VERSION)

    expect(value1).to.equal(testValue1)
    expect(value2).to.equal(testValue2)
    expect(valueNoPrefix).to.equal(testValueNoPrefix)
    expect(getSpy.firstCall.args[0]).to.equal(prefix1 + '-' + StorageKey.BEACON_SDK_VERSION)
    expect(getSpy.secondCall.args[0]).to.equal(prefix2 + '-' + StorageKey.BEACON_SDK_VERSION)
    expect(getSpy.thirdCall.args[0]).to.equal(StorageKey.BEACON_SDK_VERSION)
    expect(getSpy.callCount).to.equal(3)
  })
})
