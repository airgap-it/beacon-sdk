import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
// import * as sinon from 'sinon'

import { DAppClient, LocalStorage, TransportType } from '../../src'

import { MockTransport } from '../test-utils/MockTransport'
import { availableTransports } from '../../src/utils/is-extension-installed'
// import { myWindow } from '../../src/MockWindow'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`DAppClient`, () => {
  it(`should throw an error if initialized with an empty object`, async () => {
    try {
      const dAppClient = new DAppClient({} as any)
      expect(dAppClient).to.be.undefined
    } catch (e) {
      expect(e.message).to.equal('Name not set')
    }
  })

  it(`should initialize without an error`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    expect(dAppClient).to.not.be.undefined
  })

  it(`should have a beacon ID`, async () => {
    const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    expect(typeof (await dAppClient.beaconId)).to.equal('string')
  })

  it(`should connect and be ready`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await dAppClient.init(true, new MockTransport('TestTransport'))
      await dAppClient.connect()
      await dAppClient.ready

      clearTimeout(timeout)
      expect(await dAppClient.isConnected).to.be.true
      resolve()
    })
  })

  it(`should select P2P Transport`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      await dAppClient.init()

      clearTimeout(timeout)
      expect((await (dAppClient as any).transport).type).to.equal(TransportType.P2P)
      resolve()
    })
  })

  it(`should select ChromeTransport`, async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = global.setTimeout(() => {
        reject(new Error('TIMEOUT: Not connected'))
      }, 1000)

      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })

      const extensionRef = availableTransports.extension
      availableTransports.extension = Promise.resolve(true)

      const type = await dAppClient.init()

      availableTransports.extension = extensionRef

      clearTimeout(timeout)
      expect(type).to.equal(TransportType.POST_MESSAGE)
      expect((await (dAppClient as any).transport).type).to.equal(TransportType.POST_MESSAGE)
      resolve()
    })
  })
})
