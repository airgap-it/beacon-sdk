import { SignClient } from '@walletconnect/sign-client'
import QRCodeModal from '@walletconnect/legacy-modal'

/**
 * @internalapi
 *
 *
 */

export enum NetworkType {
  MAINNET = 'mainnet',
  GHOSTNET = 'ghostnet',
  MONDAYNET = 'mondaynet',
  DAILYNET = 'dailynet',
  KATHMANDUNET = 'kathmandunet',
  LIMANET = 'limanet'
}

export interface PermissionScopeParam {
  networks: NetworkType[]
  methods: PermissionScopeMethods[]
  events?: PermissionScopeEvents[]
}
export enum PermissionScopeMethods {
  OPERATION_REQUEST = 'tezos_sendOperations',
  SIGN = 'tezos_signExpression'
}

export enum PermissionScopeEvents {
  CHAIN_CHANGED = 'chainChanged',
  ACCOUNTS_CHANGED = 'accountsChanged'
}

const TEZOS_PLACEHOLDER = 'tezos'

export class WalletConnectTransport {
  constructor() {}

  public async init() {
    console.log('######## 0 ########')
    const initParams = {
      projectId: '97f804b46f0db632c52af0556586a5f3',
      relayUrl: 'wss://relay.walletconnect.com',
      logger: 'debug',
      metadata: {
        name: 'Kukai Wallet',
        description:
          'Manage your digital assets and seamlessly connect with experiences and apps on Tezos.',
        url: 'https://wallet.kukai.app',
        icons: []
      }
    }
    const client = await SignClient.init(initParams)
    console.log(client)

    console.log('######## 1 ########')

    // TODO JGD NEXT show QR modal

    const { uri, approval } = await client.connect({
      requiredNamespaces: {
        [TEZOS_PLACEHOLDER]: {
          chains: [`${TEZOS_PLACEHOLDER}:${NetworkType.MAINNET}`],
          methods: [PermissionScopeMethods.OPERATION_REQUEST, PermissionScopeMethods.SIGN],
          events: [PermissionScopeEvents.CHAIN_CHANGED, PermissionScopeEvents.ACCOUNTS_CHANGED]
        }
      },
      pairingTopic: ''
    })

    console.log('######## 2 ########')

    if (uri) {
      QRCodeModal.open(
        uri,
        () => {
          // noop
        },
        { registryUrl: '' }
      )
    }
    console.log('######## 3 ########')

    const session = await approval()
    console.log('######## 4 ########')

    console.log(session)
  }
}
