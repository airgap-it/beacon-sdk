import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
// import * as sinon from 'sinon'

import { DAppClient, LocalStorage, TransportType } from '../../src'

import { MockTransport } from '../test-utils/MockTransport'
import { availableTransports } from '../../src/utils/available-transports'
// import { myWindow } from '../../src/MockWindow'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`DAppClient`, () => {
  before(function () {
    /**
     * This is used to mock the window object
     *
     * We cannot do it globally because it fails in the storage tests because of security policies
     */
    this.jsdom = require('jsdom-global')()
  })

  after(function () {
    /**
     * Remove jsdom again because it's only needed in this test
     */
    this.jsdom()
  })

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

  it.skip(`should get active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should set active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should get app metadata`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should connect`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove an account and unset active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove an account and not unset active account`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove peer and all its accounts`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all peers and all their accounts`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should subscribe to an event`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should check permissions`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare a permission request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare a sign payload request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare an operation request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should prepare a broadcast request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send an internal error`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all accounts for peers`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should handle request errors`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should send notifications on success`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should create a request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should store an open request`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should store an open request and handle a response`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should not handle a response if the id is unknown`, async () => {
    expect(true).to.be.false
  })
})
