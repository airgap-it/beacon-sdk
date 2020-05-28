import {
  PermissionScope,
  AccountIdentifier,
  Origin,
  Network,
  P2PPairInfo,
  StorageKey,
  AccountInfo
} from '..'

export interface AccountInfoOld {
  accountIdentifier: AccountIdentifier
  beaconId: string
  origin: {
    type: Origin
    id: string
  }
  address: string
  pubkey: string
  network: Network
  scopes: PermissionScope[]
  connectedAt: Date
}

export interface P2PPairInfoOld {
  name: string
  pubKey: string
  relayServer: string
}

export const migrate_0_7_0 = async (storage: Storage): Promise<void> => {
  // Migrate AccountInfo
  const accountInfos: AccountInfo[] = await storage.get(StorageKey.ACCOUNTS)
  accountInfos.forEach((accountInfo) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountInfoOld: AccountInfoOld = accountInfo as any

    // pubKey is now publicKey
    if (accountInfoOld.pubkey) {
      accountInfo.publicKey = accountInfoOld.pubkey
      delete accountInfoOld.pubkey
    }
    // connectedAt is now a number
    accountInfo.connectedAt = new Date(accountInfoOld.connectedAt).getTime()
  })
  await storage.set(StorageKey.ACCOUNTS, accountInfos)

  // Migrate P2PPeers
  const p2pPairInfos: P2PPairInfo[] = await storage.get(StorageKey.TRANSPORT_P2P_PEERS)
  p2pPairInfos.forEach((p2pPairInfo) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p2pPairInfoOld: P2PPairInfoOld = p2pPairInfo as any
    // pubKey is now publicKey
    if (p2pPairInfoOld.pubKey) {
      p2pPairInfo.publicKey = p2pPairInfoOld.pubKey
      delete p2pPairInfoOld.pubKey
    }
  })
  await storage.set(StorageKey.TRANSPORT_P2P_PEERS, p2pPairInfos)

  await storage.set(StorageKey.BEACON_SDK_VERSION, '0.7.0')
}
