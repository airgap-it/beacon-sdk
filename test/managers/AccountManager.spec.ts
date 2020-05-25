import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { AccountManager } from '../../src/managers/AccountManager'

import { AccountInfo, Origin, NetworkType } from '../../src'
import { FileStorage, writeLocalFile } from '../test-utils/FileStorage'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

// TODO: Use AccountInfo type
const account1: any = {
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
  connectedAt: new Date().getTime()
}

const account2: any = {
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
  connectedAt: new Date().getTime()
}

const account3: any = {
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
  connectedAt: new Date().getTime()
}

describe(`AccountManager`, () => {
  let manager: AccountManager
  beforeEach(async () => {
    await writeLocalFile({})

    manager = new AccountManager(new FileStorage())
  })
  it(`reads and adds accounts`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after').to.equal(1)
  })

  it(`reads and adds multiple accounts`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account2)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after').to.equal(2)
  })

  it(`only adds an account once`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account1)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after').to.equal(1)
  })

  it(`reads one account`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account2)
    const account = await manager.getAccount(account1.accountIdentifier)
    expect(account, 'after').to.deep.include(account1)
  })

  it(`removes one account`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account2)
    await manager.addAccount(account3)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after add').to.equal(3)

    await manager.removeAccount(account1.accountIdentifier)
    const accountsAfterRemove: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfterRemove.length, 'after remove').to.equal(2)
    expect(accountsAfterRemove, 'after remove, account2').to.deep.include(account2)
    expect(accountsAfterRemove, 'after remove, account3').to.deep.include(account3)
  })

  it(`removes many accounts`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account2)
    await manager.addAccount(account3)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after add').to.equal(3)

    await manager.removeAccounts([account1.accountIdentifier, account2.accountIdentifier])
    const accountsAfterRemove: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfterRemove.length, 'after remove').to.equal(1)
    expect(accountsAfterRemove, 'after remove').to.deep.include(account3)
  })

  it(`removes all accounts`, async () => {
    const accountsBefore: AccountInfo[] = await manager.getAccounts()
    expect(accountsBefore.length, 'before').to.equal(0)

    await manager.addAccount(account1)
    await manager.addAccount(account2)
    await manager.addAccount(account3)
    const accountsAfter: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfter.length, 'after add').to.equal(3)

    await manager.removeAllAccounts()
    const accountsAfterRemove: AccountInfo[] = await manager.getAccounts()

    expect(accountsAfterRemove.length, 'after remove').to.equal(0)
  })
})
