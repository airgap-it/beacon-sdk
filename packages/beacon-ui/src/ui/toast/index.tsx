import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject, Subscription } from '../../utils/subject'
import Toast from 'src/components/toast'
import { ToastConfig } from '../common'

let initDone: boolean = false
const config$ = new Subject<ToastConfig | undefined>()
const show$ = new Subject<boolean>()

const createToast = (config: ToastConfig) => {
  const el = document.createElement('beacon-toast')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<ToastRoot {...config} />), 50)
  initDone = true
}

const openToast = (config: ToastConfig) => {
  if (initDone) {
    config$.next(config)
  } else {
    createToast(config)
  }

  if (config.state !== 'finished') {
    show$.next(true)
  } else {
    config.timer && setTimeout(() => show$.next(false), config.timer)
  }
}

const closeToast = () => {
  config$.next(undefined)
  show$.next(false)
}

const ToastRoot = (props: ToastConfig) => {
  const [config, setConfig] = useState<ToastConfig | undefined>(props)
  const [isOpen, setIsOpen] = useState(true)
  const [mount, setMount] = useState(false)

  useEffect(() => {
    const subs: Subscription[] = []
    subs.push(
      config$.subscribe((config) => {
        setConfig(config)
      })
    )
    subs.push(
      show$.subscribe((value) => {
        setIsOpen(value)
      })
    )
    return () => subs.forEach((sub) => sub.unsubscribe())
  }, [])

  useEffect(() => {
    if (isOpen) {
      setMount(true)
      return
    }

    // unmount the component immediately
    // if the close icon is clicked
    // or whenever closeToast is called.
    if (!config) {
      setMount(false)
      return
    }

    // we need to wait a little before unmounting the component
    // because otherwise the "fade-out" animation
    // won't have enough time to play
    if (config && config.timer) {
      setTimeout(() => setMount(false), config.timer)
    }

    // no else that acts like a "default"
    // because some toasts do not close automatically
  }, [isOpen])

  return (
    <>
      {mount && config && (
        <Toast
          label={config.body}
          open={isOpen}
          onClickClose={() => {
            closeToast()
          }}
          actions={config.actions}
          walletInfo={config.walletInfo}
          openWalletAction={config.openWalletAction}
        />
      )}
    </>
  )
}

export { closeToast, openToast }
