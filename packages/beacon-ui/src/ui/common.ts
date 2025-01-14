import { NetworkType, AnalyticsInterface, WalletInfo } from '@airgap/beacon-types'
import { MergedWallet } from '../utils/wallets'

// ALERT

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

// TOAST

export interface ToastAction {
  text: string
  isBold?: boolean
  actionText?: string
  actionLogo?: 'external'
  actionCallback?(): Promise<void>
}

export interface ToastConfig {
  body: string
  timer?: number
  forceNew?: boolean
  state: 'prepare' | 'loading' | 'acknowledge' | 'finished'
  actions?: ToastAction[]
  walletInfo?: WalletInfo
  openWalletAction?(): Promise<void>
}

export interface ToastProps {
  label: string
  open: boolean
  onClickClose: () => void
  actions?: {
    text: string
    isBold?: boolean
    actionText?: string
    actionCallback?: () => void
  }[]
  walletInfo?: {
    deeplink?: string
    icon?: string
    name: string
    type?: string
  }
  openWalletAction?: () => void
}
