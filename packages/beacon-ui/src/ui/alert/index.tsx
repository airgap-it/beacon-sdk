import { createRoot } from 'react-dom/client'
import AlertContent from './components/alert-content'
import { useEffect, useState } from 'react'
import { Subject } from '../../utils/subject'
import { AlertConfig } from './common'
import PairingAlert from './components/pairing-alert'

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
        <PairingAlert
          open={true}
          loading={false}
          onClose={() => closeAlert()}
          content={<AlertContent />}
        />
      )}
    </>
  )
}

export { openAlert, closeAlert, closeAlerts }
