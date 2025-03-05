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
  pairingPayload?: PairingPayload
  closeButtonCallback?: () => void
  disclaimerText?: string
  analytics?: AnalyticsInterface
  featuredWallets?: string[]
  openBugReport?: boolean
}

export interface ConfigurableAlertProps extends Omit<AlertConfig, 'closeButtonCallback'> {
  open: boolean
  onClose: () => void
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

export interface PairingPayload {
  p2pSyncCode: () => Promise<string>
  postmessageSyncCode: () => Promise<string>
  walletConnectSyncCode: () => Promise<string>
  networkType: NetworkType
}

export interface PairOtherProps {
  walletList: MergedWallet[]
  p2pPayload: string
  wcPayload: string
  onClickLearnMore: () => void
}

export interface QRProps {
  isWalletConnect: boolean
  isMobile: boolean
  walletName: string
  code: string
  onClickLearnMore?: () => void
  onClickQrCode?: () => void
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
  wallets: MergedWallet[];
  onClickWallet: (id: string) => void;
  onClickLearnMore: () => void;
  otherWallets?: { images: string[]; onClick: () => void };
  disabled?: boolean;
  isMobile: boolean;
}

export interface WalletProps {
  name: string;
  image: string;
  description?: string;
  small?: boolean;
  mobile?: boolean;
  onClick: () => void;
  tags?: string[];
  disabled?: boolean;
}

export interface WalletsProps {
  wallets: MergedWallet[];
  onClickWallet: (id: string) => void;
  onClickOther: () => void;
  isMobile: boolean;
  small?: boolean;
  disabled?: boolean;
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
