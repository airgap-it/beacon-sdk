import {
  P2PPairingRequest,
  PostMessagePairingRequest,
  WalletConnectPairingRequest,
  NetworkType,
  AnalyticsInterface
} from '@airgap/beacon-types'
import { createRoot, Root } from 'react-dom/client'
import Alert from '../../components/alert'

// Interfaces
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

let root: Root | undefined

const openAlert = (_config: AlertConfig) => {
  const el = document.createElement('beacon-modal')
  document.body.prepend(el)
  const _root = root ? root : (root = createRoot(el))
  setTimeout(() => _root.render(<AlertRoot />), 50)
}

const closeAlert = () => {
  root?.unmount()
}

const closeAlerts = () => {
  closeAlert()
}

const AlertRoot = () => {
  return (
    <Alert
      open={true}
      loading={false}
      onCloseClick={() => closeAlert()}
      content={<h1>Hello New World!</h1>}
    />
  )
}

export { openAlert, closeAlert, closeAlerts }
