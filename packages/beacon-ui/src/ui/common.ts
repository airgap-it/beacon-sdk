import { NetworkType, AnalyticsInterface, WalletInfo } from '@airgap/beacon-types'
import { MergedWallet } from '../utils/wallets'

// ALERT

export enum AlertState {
  TOP_WALLETS = 'top-wallets',
  WALLETS = 'wallets',
  INSTALL = 'install',
  BUG_REPORT = 'bug-report',
  QR = 'qr',
}

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
  pairingPayload?: PairingPayload
  closeButtonCallback?: () => void
  analytics?: AnalyticsInterface
  featuredWallets?: string[]
  termsAndConditionsUrl?: string
  privacyPolicyUrl?: string
  openBugReport?: boolean
  substratePairing?: boolean
}

export interface ConfigurableAlertProps extends Omit<AlertConfig, 'closeButtonCallback'> {
  open: boolean
  onClose: () => void
  closeOnBackdropClick: boolean
}

export interface AlertProps {
  open: boolean
  showMore?: boolean
  extraContent?: any
  loading?: boolean
  onCloseClick: () => void
  onClickShowMore?: () => void
  onBackClick?: () => void
  closeOnBackdropClick: boolean
  termsAndConditionsUrl?: string
  privacyPolicyUrl?: string
}

export interface PairingPayload {
  p2pSyncCode: Promise<string>
  postmessageSyncCode: Promise<string>
  walletConnectSyncCode: Promise<string>
  networkType: NetworkType
}

export interface PairOtherProps {
  walletList: MergedWallet[]
  p2pPayload: Promise<string>
  wcPayload: Promise<string>
  onClickLearnMore: () => void
}

export interface QRProps {
  isWalletConnect: boolean
  isMobile: boolean
  walletName: string
  code: string
  onClickLearnMore?: () => void
  onClickQrCode?: () => void
  isDeprecated?: boolean
}

export interface QRCodeProps {
  wallet?: MergedWallet
  isWCWorking: boolean
  isMobile: boolean
  qrCode?: string
  defaultPairing: Promise<string>
  handleUpdateState: (state: AlertState) => void
  handleIsLoading: (isLoading: boolean) => void
}

export interface WCInitErrorProps {
  title: string
  handleUpdateState: (state: AlertState) => void
}

export interface InfoProps {
  title: string
  description?: string
  data?: string
  icon?: any
  border?: boolean
  iconBadge?: boolean
  bigIcon?: boolean
  buttons?: {
    label: string
    type: 'primary' | 'secondary'
    onClick: () => void
  }[]
  downloadLink?: { url: string; label: string }
  onShowQRCodeClick?: (() => void) | (() => Promise<void>)
}

// WALLETS

export interface TopWalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickLearnMore: () => void
  otherWallets?: { images: string[]; onClick: () => void }
  disabled?: boolean
  isMobile: boolean
}

export interface WalletProps {
  name: string
  image: string
  description?: string
  small?: boolean
  mobile?: boolean
  onClick: () => void
  tags?: string[]
  disabled?: boolean
}

export interface WalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickOther: () => void
  isMobile: boolean
  small?: boolean
  disabled?: boolean
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
