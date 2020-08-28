import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'
// import sinon from 'sinon'

import { DAppClient, LocalStorage } from '../../src'

import { MockLocalStorage } from '../test-utils/MockLocalStorage'
import { MockTransport } from '../test-utils/MockTransport'
;(global as any).localStorage = new MockLocalStorage()
;(global as any).temp = {
  yolo: () => undefined
}
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
    return new Promise(async (resolve) => {
      const dAppClient = new DAppClient({ name: 'Test', storage: new LocalStorage() })
      dAppClient.beaconId
      expect(typeof (await dAppClient.beaconId)).to.equal('string')

      await dAppClient.init()
      console.log((dAppClient as any).transport)
      await dAppClient.init(true, new MockTransport('TestTransport'))
      console.log('init')
      await dAppClient.connect()
      console.log('init')
      await dAppClient.ready
      const timeout = setTimeout(() => {
        resolve()
        clearTimeout(timeout)
      }, 1000)
    })
  })
})
