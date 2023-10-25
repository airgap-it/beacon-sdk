import { BeaconMessageType, NetworkType } from '@mavrykdynamics/beacon-types'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

import { TezosSaplingBlockchain, TezosSaplingPermissionScope } from '../src'

describe('@mavrykdynamics/beacon-blockchain-tezos-sapling', () => {
  it('should have wallets', async () => {
    const blockchain = new TezosSaplingBlockchain()

    const wallets = await blockchain.getWalletLists()

    expect(Array.isArray(wallets.desktopList)).to.be.true
    expect(Array.isArray(wallets.extensionList)).to.be.true
    expect(Array.isArray(wallets.iOSList)).to.be.true
    expect(Array.isArray(wallets.webList)).to.be.true
  })

  it('should handle a permission response', async () => {
    const blockchain = new TezosSaplingBlockchain()

    const accountInfos = await blockchain.getAccountInfosFromPermissionResponse({
      blockchainIdentifier: 'tezos-sapling',
      type: BeaconMessageType.PermissionResponse,
      blockchainData: {
        appMetadata: { senderId: 'sender', name: 'name' },
        scopes: [TezosSaplingPermissionScope.transfer],
        accounts: [
          {
            accountId: 'account',
            address: 'zet1...',
            viewingKey: 'viewingKey...',
            network: {
              contract: 'KT1...',
              type: NetworkType.MAINNET
            }
          }
        ]
      }
    })

    expect(accountInfos.length).to.equal(1)
    expect(accountInfos[0].accountId).to.equal('account')
    expect(accountInfos[0].publicKey).to.equal('viewingKey...')
    expect(accountInfos[0].address).to.equal('zet1...')
  })
})
