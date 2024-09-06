import {
  P2PPairingRequest,
  PostMessagePairingRequest,
  WalletConnectPairingRequest,
  NetworkType,
  AnalyticsInterface
} from '@airgap/beacon-types'
import { createRoot } from 'react-dom/client'
import Alert from '../../components/alert'
import AlertContent from './components/alert-content'
import { useEffect, useState } from 'react'
import { Subject } from 'src/utils/subject'

export interface AlertButton {
  label: string
  type: 'primary' | 'secondary'
  onClick: () => void
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

let initDone: boolean = false
const show$ = new Subject<boolean>()

const createAlert = () => {
  const el = document.createElement('beacon-modal')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<AlertRoot />), 50)
  initDone = true
}

const openAlert = (_config: AlertConfig) => {
  !initDone && createAlert()
  show$.next(true)
}

const closeAlert = () => {
  show$.next(false)
}

const closeAlerts = () => {
  closeAlert()
}

const AlertRoot = (_props: any) => {
  const [isAlertVisible, setIsAlertVisible] = useState(true)
  useEffect(() => {
    show$.subscribe((value) => setIsAlertVisible(value))
  }, [])
  return (
    <>
      {isAlertVisible && (
        <Alert
          open={true}
          loading={false}
          onCloseClick={() => closeAlert()}
          content={<AlertContent />}
        />
      )}
    </>
  )
}

export { openAlert, closeAlert, closeAlerts }
