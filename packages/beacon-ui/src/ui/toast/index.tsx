import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject, Subscription } from '../../utils/subject'
import Toast from 'src/components/toast'
import { ToastConfig } from '../common'

let initDone: boolean = false
const config$ = new Subject<ToastConfig | undefined>()
const show$ = new Subject<boolean>()
let lastTimer: NodeJS.Timeout | undefined

const createToast = (config: ToastConfig) => {
  const el = document.createElement('beacon-toast')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<ToastRoot {...config} />), 50)
  initDone = true
}

const openToast = (config: ToastConfig) => {
  // we need to give time to React to process re-render cycles
  initDone ? setTimeout(() => config$.next(config), 500) : createToast(config)

  if (lastTimer) {
    clearTimeout(lastTimer)
    lastTimer = undefined
  }

  lastTimer = config.timer ? setTimeout(() => show$.next(false), config.timer) : undefined

  show$.next(true)
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
    // unmount the component immediately
    // if the close icon is clicked
    // or whenever closeToast is called.
    if (!config) {
      setMount(false)
      return
    }

    if (isOpen) {
      setMount(true)
      return
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
