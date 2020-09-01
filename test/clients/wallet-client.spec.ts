import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
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
})
