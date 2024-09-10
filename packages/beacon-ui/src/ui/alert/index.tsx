import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject } from '../../utils/subject'
import { AlertConfig } from './common'
import PairingAlert from './components/pairing-alert'

let initDone: boolean = false
const show$ = new Subject<boolean>()

const createAlert = (config: AlertConfig) => {
  const el = document.createElement('beacon-modal')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<AlertRoot {...config} />), 50)
  initDone = true
}

const openAlert = (config: AlertConfig) => {
  !initDone && createAlert(config)
  show$.next(true)
}

const closeAlert = () => {
  show$.next(false)
}

const closeAlerts = () => {
  closeAlert()
}

const AlertRoot = (props: AlertConfig) => {
  const [isAlertVisible, setIsAlertVisible] = useState(true)
  useEffect(() => {
    show$.subscribe((value) => setIsAlertVisible(value))
  }, [])
  return <>{isAlertVisible && <PairingAlert {...props} closeButtonCallback={closeAlert} />}</>
}

export { openAlert, closeAlert, closeAlerts }
