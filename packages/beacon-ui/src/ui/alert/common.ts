import { NetworkType, AnalyticsInterface } from '@airgap/beacon-types'
import { MergedWallet } from '../../utils/wallets'

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
    p2pSyncCode: string
    postmessageSyncCode: string
    walletConnectSyncCode: string
    networkType: NetworkType
  }
  closeButtonCallback?: () => void
  disclaimerText?: string
  analytics?: AnalyticsInterface
  featuredWallets?: string[]
}

export interface AlertProps {
  open: boolean
  showMore?: boolean
  extraContent?: any
  loading?: boolean
  onCloseClick: () => void
  onClickShowMore?: () => void
  onBackClick?: () => void
}

export interface PairOtherProps {
  walletList: MergedWallet[]
  p2pPayload: string
  wcPayload: string
  onClickLearnMore: () => void
}
