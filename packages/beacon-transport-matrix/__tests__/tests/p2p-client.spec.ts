import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import * as sinon from 'sinon'

import { P2PCommunicationClient } from '../../src'
import { getKeypairFromSeed } from '@airgap/beacon-utils'
import { LocalStorage } from '@airgap/beacon-core'

chai.use(chaiAsPromised)
const expect = chai.expect

const SEED = 'test'

describe(`P2PCommunicationClient`, () => {
  let client: P2PCommunicationClient

  beforeEach(async () => {
    sinon.restore()

    const keypair = await getKeypairFromSeed(SEED)
    const localStorage = new LocalStorage()

    client = new P2PCommunicationClient('Test', keypair, 2, localStorage, {})
  })

  it(`should have more than 1 node per region available`, async () => {
    const keyValue: [string, string][] = Object.values((client as any).ENABLED_RELAY_SERVERS)
    expect(keyValue.length >= 1).to.be.true
    keyValue.forEach((kv) => {
      expect(kv[1].length >= 1).to.be.true
    })
  })
})
