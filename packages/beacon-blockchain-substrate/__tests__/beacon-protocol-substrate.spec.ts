import { BeaconMessageType } from '@mavrykdynamics/beacon-types'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

import { SubstrateBlockchain, SubstratePermissionScope } from '../src'

describe('@mavrykdynamics/beacon-blockchain-substrate', () => {
  it('should have wallets', async () => {
    const blockchain = new SubstrateBlockchain()

    const wallets = await blockchain.getWalletLists()

    expect(Array.isArray(wallets.desktopList)).to.be.true
    expect(Array.isArray(wallets.extensionList)).to.be.true
    expect(Array.isArray(wallets.iOSList)).to.be.true
    expect(Array.isArray(wallets.webList)).to.be.true
  })

  it('should handle a permission response', async () => {
    const blockchain = new SubstrateBlockchain()

    const accountInfos = await blockchain.getAccountInfosFromPermissionResponse({
      blockchainIdentifier: 'substrate',
      type: BeaconMessageType.PermissionResponse,
      blockchainData: {
        appMetadata: { senderId: 'sender', name: 'name' },
        scopes: [SubstratePermissionScope.transfer],
        accounts: [
          {
            accountId: 'account',
            publicKey: 'pubKey',
            address: 'address'
          }
        ]
      }
    })

    expect(accountInfos.length).to.equal(1)
    expect(accountInfos[0].accountId).to.equal('account')
    expect(accountInfos[0].publicKey).to.equal('pubKey')
    expect(accountInfos[0].address).to.equal('address')
  })
})
