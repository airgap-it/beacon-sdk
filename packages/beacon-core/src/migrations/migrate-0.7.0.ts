import {
  PermissionScope,
  AccountIdentifier,
  Origin,
  Network,
  P2PPairingRequest,
  StorageKey,
  AccountInfo
} from '@mavrykdynamics/beacon-types'

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

export interface P2PPairingRequestOld {
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
      delete (accountInfoOld as any).pubkey
    }
    // connectedAt is now a number
    accountInfo.connectedAt = new Date(accountInfoOld.connectedAt).getTime()
  })
  await storage.set(StorageKey.ACCOUNTS, accountInfos)

  // Migrate P2PPeers
  const P2PPairingRequests: P2PPairingRequest[] = await storage.get(
    StorageKey.TRANSPORT_P2P_PEERS_DAPP
  )
  P2PPairingRequests.forEach((p2pPairInfo) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const P2PPairingRequestOld: P2PPairingRequestOld = p2pPairInfo as any
    // pubKey is now publicKey
    if (P2PPairingRequestOld.pubKey) {
      p2pPairInfo.publicKey = P2PPairingRequestOld.pubKey
      delete (P2PPairingRequestOld as any).pubKey
    }
  })
  await storage.set(StorageKey.TRANSPORT_P2P_PEERS_DAPP, P2PPairingRequests)

  await storage.set(StorageKey.BEACON_SDK_VERSION, '0.7.0')
}
