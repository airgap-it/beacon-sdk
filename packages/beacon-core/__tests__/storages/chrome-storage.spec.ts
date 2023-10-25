import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { StorageKey } from '@mavrykdynamics/beacon-types'

import { ChromeStorage } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const chromeRef = globalThis.chrome

const cbSetFn = (_obj: unknown, cb: () => void) => {
  cb()
}
const cbGetFn = (_obj: unknown, cb: (obj: unknown) => void) => {
  cb({})
}

describe(`ChromeStorage`, () => {
  let getSpy: sinon.SinonSpy<any[], any>
  let setSpy: sinon.SinonSpy<any[], any>

  beforeEach(() => {
    globalThis.chrome = chromeRef

    getSpy = sinon.spy(cbGetFn)
    setSpy = sinon.spy(cbSetFn)

    globalThis.chrome = {
      storage: {
        local: {
          set: setSpy,
          get: getSpy
        }
      }
    } as any
  })

  it(`should not be supported`, async () => {
    const isSupported = await ChromeStorage.isSupported()
    expect(isSupported).to.be.false
  })

  it(`should be supported`, async () => {
    const windowRef = globalThis.window
    const chromeRef = globalThis.chrome

    globalThis.window = {
      ...globalThis.window,
      chrome: {
        runtime: {
          id: 'some-id'
        } as any
      } as any
    } as any

    globalThis.chrome = {
      runtime: {
        id: 'some-id'
      } as any
    } as any

    const isSupported = await ChromeStorage.isSupported()

    globalThis.window = windowRef
    globalThis.chrome = chromeRef

    expect(isSupported).to.be.true
  })

  it(`should write a value to the storage`, async () => {
    const storage = new ChromeStorage()

    const testValue = 'test-version'

    await storage.set(StorageKey.BEACON_SDK_VERSION, testValue)

    expect(setSpy.firstCall.args[0]).to.deep.equal({ [StorageKey.BEACON_SDK_VERSION]: testValue })
    expect(setSpy.callCount).to.equal(1)
  })

  it(`should delete a value to the storage`, async () => {
    const storage = new ChromeStorage()

    await storage.delete(StorageKey.BEACON_SDK_VERSION)

    expect(setSpy.firstCall.args[0]).to.deep.equal({ [StorageKey.BEACON_SDK_VERSION]: undefined })
    expect(setSpy.callCount).to.equal(1)
  })

  it(`should read a default value from the storage`, async () => {
    const storage = new ChromeStorage()

    const valueVersion = await storage.get(StorageKey.BEACON_SDK_VERSION)

    expect(valueVersion).to.be.undefined
    expect(getSpy.firstCall.args[0]).to.deep.equal(null)
    expect(getSpy.callCount).to.equal(1)

    const valueAccounts = await storage.get(StorageKey.ACCOUNTS)

    expect(valueAccounts).to.deep.equal([])
    expect(getSpy.secondCall.args[0]).to.deep.equal(null)
    expect(getSpy.callCount).to.equal(2)
  })

  it(`should read a value from the storage`, async () => {
    const storage = new ChromeStorage()

    const testValue = 'test-version1'

    getSpy = sinon.spy((_obj: unknown, cb: (obj: unknown) => void) => {
      cb({
        [StorageKey.BEACON_SDK_VERSION]: testValue
      })
    })

    globalThis.chrome = {
      storage: {
        local: {
          set: setSpy,
          get: getSpy
        }
      }
    } as any

    const value = await storage.get(StorageKey.BEACON_SDK_VERSION)

    expect(value).to.equal(testValue)
    expect(getSpy.firstCall.args[0]).to.deep.equal(null)
    expect(getSpy.callCount).to.equal(1)
  })
})
