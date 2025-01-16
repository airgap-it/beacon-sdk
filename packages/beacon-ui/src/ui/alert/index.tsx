import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject } from '../../utils/subject'
import { AlertConfig } from '../common'
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
  const [isOpen, setIsOpen] = useState(true)
  const [mount, setMount] = useState(false)

  useEffect(() => {
    const sub = show$.subscribe((value) => setIsOpen(value))
    return () => sub.unsubscribe()
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

  return <>{mount && <PairingAlert {...props} onClose={closeAlert} open={isOpen} />}</>
}

export { openAlert, closeAlert, closeAlerts }
