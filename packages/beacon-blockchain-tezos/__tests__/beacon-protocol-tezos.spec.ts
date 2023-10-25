import { BeaconMessageType } from '@mavrykdynamics/beacon-types'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

import { TezosBlockchain } from '../src'

describe('@mavrykdynamics/beacon-blockchain-tezos', () => {
  it('should have wallets', async () => {
    const blockchain = new TezosBlockchain()

    const wallets = await blockchain.getWalletLists()

    expect(Array.isArray(wallets.desktopList)).to.be.true
    expect(Array.isArray(wallets.extensionList)).to.be.true
    expect(Array.isArray(wallets.iOSList)).to.be.true
    expect(Array.isArray(wallets.webList)).to.be.true
  })

  it('should handle a permission response', async () => {
    const blockchain = new TezosBlockchain()

    const accountInfos = await blockchain.getAccountInfosFromPermissionResponse({
      blockchainIdentifier: 'tezos',
      type: BeaconMessageType.PermissionResponse,
      blockchainData: {
        appMetadata: { senderId: 'sender', name: 'name' },
        scopes: ['test']
      }
    })

    expect(accountInfos.length).to.equal(1)
    expect(accountInfos[0].accountId).to.equal('')
    expect(accountInfos[0].publicKey).to.equal('')
    expect(accountInfos[0].address).to.equal('')
  })
})
