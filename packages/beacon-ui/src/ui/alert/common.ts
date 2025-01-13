import {
  P2PPairingRequest,
  PostMessagePairingRequest,
  WalletConnectPairingRequest,
  NetworkType,
  AnalyticsInterface
} from '@airgap/beacon-types'

export interface AlertButton {
  text: string
  style?: 'solid' | 'outline'
  actionCallback?(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  data?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    walletConnectSyncCode: () => Promise<WalletConnectPairingRequest>
    networkType: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
  analytics?: AnalyticsInterface
  featuredWallets?: string[]
}

export interface AlertProps {
  content: any
  open: boolean
  showMore?: boolean
  extraContent?: any
  loading?: boolean
  onCloseClick: () => void
  onClickShowMore?: () => void
  onBackClick?: () => void
}
