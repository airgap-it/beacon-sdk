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

const SEED = 'test'

describe(`P2PCommunicationClient`, () => {
  let client: P2PCommunicationClient

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed(SEED)
    const localStorage = new LocalStorage()
    const eventHandler = new BeaconEventHandler()
    sinon.stub(eventHandler, 'emit').resolves()

    client = new P2PCommunicationClient('Test', keypair, 2, localStorage, [])
  })

  it(`should have more than 1 node available`, async () => {
    expect((client as any).ENABLED_RELAY_SERVERS.length > 1).to.be.true
  })
})
