import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject, Subscription } from '../../utils/subject'
import { AlertConfig, ConfigurableAlertProps } from '../common'
import PairingAlert from './components/pairing-alert'
import InfoAlert from './components/info-alert'
import { getColorMode } from 'src/utils/colorMode'
import { NetworkType } from '@airgap/beacon-types'

let initDone: boolean = false
const show$ = new Subject<boolean>()
const config$ = new Subject<AlertConfig>()

const createAlert = (config: AlertConfig) => {
  const el = document.createElement('beacon-modal')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<AlertRoot {...config} />), 50)
  initDone = true
}

const openAlert = (config: AlertConfig) => {
  if (initDone) {
    config$.next(config)
  } else {
    createAlert(config)
  }
  show$.next(true)
}

const openBugReport = () => {
  openAlert({
    title: '',
    body: '',
    buttons: [],
    openBugReport: true,
    pairingPayload: {
      walletConnectSyncCode: '',
      p2pSyncCode: '',
      postmessageSyncCode: '',
      networkType: NetworkType.GHOSTNET
    }
  })
}

const closeAlert = () => {
  show$.next(false)
}

/**
 * @deprecated use `closeAlert` instead
 */
const closeAlerts = () => {
  closeAlert()
}

const AlertRoot = (props: AlertConfig) => {
  const [isOpen, setIsOpen] = useState(true)
  const [mount, setMount] = useState(false)
  const [config, setConfig] = useState<AlertConfig>(props)

  useEffect(() => {
    const subs: Subscription[] = []
    subs.push(show$.subscribe((value) => setIsOpen(value)))
    subs.push(config$.subscribe((value) => setConfig(value)))
    return () => subs.forEach((sub) => sub.unsubscribe())
  }, [])

  useEffect(() => {
    if (isOpen) {
      setMount(true)
    } else {
      // we need to wait a little before unmounting the component
      // because otherwise the "fade-out" animation
      // won't have enough time to play
      setTimeout(() => setMount(false), 300)
    }
  }, [isOpen])

  const onCloseHandler = () => {
    closeAlert()
    config.closeButtonCallback && config.closeButtonCallback()
  }

  const filteredProps: ConfigurableAlertProps = {
    ...config,
    onClose: onCloseHandler,
    open: isOpen
  }

  const Alert = () => {
    return config.pairingPayload || config.openBugReport ? (
      <PairingAlert {...filteredProps} />
    ) : (
      <InfoAlert {...filteredProps} />
    )
  }

  return <div className={`theme__${getColorMode()}`}>{mount && <Alert />} </div>
}

export { openAlert, openBugReport, closeAlert, closeAlerts }
