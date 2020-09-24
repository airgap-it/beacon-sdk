import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { LocalStorage, P2PCommunicationClient } from '../../src'
import { BeaconEventHandler } from '../../src/events'
import { getKeypairFromSeed } from '../../src/utils/crypto'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe.only(`P2PCommunicationClient`, () => {
  let client: P2PCommunicationClient

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed('test')
    const localStorage = new LocalStorage()
    const eventHandler = new BeaconEventHandler()
    sinon.stub(eventHandler, 'emit').resolves()

    client = new P2PCommunicationClient('Test', keypair, localStorage, [], true)
  })

  it(`should return a relay server deterministically`, async () => {
    const relayServer1 = await client.getRelayServer()
    const relayServer2 = await client.getRelayServer()
    expect(relayServer1).to.equal(relayServer2)
  })

  it(`should have a random starting point`, async () => {
    const relayServer1 = await client.getRelayServer()
    const relayServer2 = await client.getRelayServer()
    expect(relayServer1).to.equal(relayServer2)
  })
})
