import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { FileStorage, writeLocalFile } from '../../../../test/test-utils/FileStorage'
import { NetworkType, Origin, Storage, StorageKey } from '@mavrykdynamics/beacon-types'
import { migrate } from '../../src/migrations/migrations'
import { AccountInfoOld, P2PPairingRequestOld } from '../../src/migrations/migrate-0.7.0'
import { SDK_VERSION } from '../../src'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe(`Migrations`, () => {
  let storage: Storage
  beforeEach(async () => {
    await writeLocalFile({})

    storage = new FileStorage()
  })

  it(`migrates 0.7.0`, async () => {
    const account1: AccountInfoOld = {
      accountIdentifier: 'a1',
      beaconId: 'id1',
      origin: {
        type: Origin.P2P,
        id: 'o1'
      },
      address: 'tz1',
      pubkey: 'pubkey1',
      network: { type: NetworkType.MAINNET },
      scopes: [],
      connectedAt: new Date()
    }

    const account2: AccountInfoOld = {
      accountIdentifier: 'a2',
      beaconId: 'id2',
      origin: {
        type: Origin.P2P,
        id: 'o2'
      },
      address: 'tz2',
      pubkey: 'pubkey2',
      network: { type: NetworkType.MAINNET },
      scopes: [],
      connectedAt: new Date()
    }

    const account3: AccountInfoOld = {
      accountIdentifier: 'a3',
      beaconId: 'id3',
      origin: {
        type: Origin.P2P,
        id: 'o3'
      },
      address: 'tz3',
      pubkey: 'pubkey3',
      network: { type: NetworkType.MAINNET },
      scopes: [],
      connectedAt: new Date()
    }

    const p2pInfo1: P2PPairingRequestOld = {
      name: 'name1',
      pubKey: 'pubkey1',
      relayServer: 'relayServer1'
    }

    const p2pInfo2: P2PPairingRequestOld = {
      name: 'name2',
      pubKey: 'pubkey2',
      relayServer: 'relayServer2'
    }

    await storage.set(StorageKey.BEACON_SDK_VERSION, '0.6.0')
    await storage.set(StorageKey.ACCOUNTS, [account1, account2, account3] as any)
    await storage.set(StorageKey.TRANSPORT_P2P_PEERS_DAPP, [p2pInfo1, p2pInfo2] as any)

    await migrate(storage)

    const storedSdkVersion = await storage.get(StorageKey.BEACON_SDK_VERSION)
    const accounts = await storage.get(StorageKey.ACCOUNTS)
    const p2pInfos = await storage.get(StorageKey.TRANSPORT_P2P_PEERS_DAPP)

    expect(storedSdkVersion).to.equal(SDK_VERSION)

    expect(accounts[0].publicKey).to.equal(account1.pubkey)
    expect(accounts[1].publicKey).to.equal(account2.pubkey)
    expect(accounts[2].publicKey).to.equal(account3.pubkey)

    expect((accounts[0] as any).pubkey).to.undefined
    expect((accounts[1] as any).pubkey).to.undefined
    expect((accounts[2] as any).pubkey).to.undefined

    expect(typeof accounts[0].connectedAt).to.equal('number')
    expect(typeof accounts[1].connectedAt).to.equal('number')
    expect(typeof accounts[2].connectedAt).to.equal('number')

    expect(p2pInfos[0].publicKey).to.equal(p2pInfo1.pubKey)
    expect(p2pInfos[1].publicKey).to.equal(p2pInfo2.pubKey)

    expect((p2pInfos[0] as any).pubKey).to.undefined
    expect((p2pInfos[1] as any).pubKey).to.undefined
  })
})
