import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { LocalStorage } from '../../src'
// import sinon from 'sinon'

import { WalletClient } from '../../src/clients/wallet-client/WalletClient'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`WalletClient`, () => {
  it(`should throw an error if initialized with an empty object`, async () => {
    try {
      const walletClient = new WalletClient({} as any)
      expect(walletClient).to.be.undefined
    } catch (e) {
      expect(e.message).to.equal('Name not set')
    }
  })

  it(`should initialize without an error`, async () => {
    const walletClient = new WalletClient({ name: 'Test' })
    expect(walletClient).to.not.be.undefined
  })

  it(`should have a beacon ID`, async () => {
    const walletClient = new WalletClient({ name: 'Test', storage: new LocalStorage() })
    expect(typeof (await walletClient.beaconId)).to.equal('string')
  })

  it(`should connect and be ready`, async () => {
    // return new Promise(async (resolve, reject) => {
    //   const timeout = global.setTimeout(() => {
    //     reject(new Error('TIMEOUT: Not connected'))
    //   }, 1000)
    //   const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
    //   await dAppClient.init(true, new MockTransport('TestTransport'))
    //   await dAppClient.connect()
    //   await dAppClient.ready
    //   clearTimeout(timeout)
    //   expect(await dAppClient.isConnected).to.be.true
    //   resolve()
    // })
  })

  it.skip(`should respond to a message`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove a peer and all its permissions`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all peers and all their permissions`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should remove all permissions for peers`, async () => {
    expect(true).to.be.false
  })

  it.skip(`should respond to a message`, async () => {
    expect(true).to.be.false
  })
})
