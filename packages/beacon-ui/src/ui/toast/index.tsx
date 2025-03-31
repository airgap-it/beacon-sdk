import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject, Subscription } from '../../utils/subject'
import Toast from 'src/components/toast'
import { ToastConfig } from '../common'

let initDone: boolean = false
const config$ = new Subject<ToastConfig | undefined>()
const show$ = new Subject<boolean>()
let lastTimer: NodeJS.Timeout | undefined

// Track when openToast was last called and how many consecutive calls were made.
let lastCallTimestamp = 0
let requestCount = 0
const BASE_DELAY = 500
const COOLDOWN = 2000
const DELAY_INCREMENT = 100

const createToast = (config: ToastConfig) => {
  const el = document.createElement('beacon-toast')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<ToastRoot {...config} />), 50)
  initDone = true
}

const openToast = (config: ToastConfig) => {
  const now = Date.now()

  // Reset the counter if more than COOLDOWN ms have passed since the last call.
  if (now - lastCallTimestamp > COOLDOWN) {
    requestCount = 1
  } else {
    requestCount++
  }
  lastCallTimestamp = now

  // Calculate delay: first request is immediate, second is BASE_DELAY,
  // subsequent requests add DELAY_INCREMENT ms for each additional call.
  const timeoutDelay = requestCount === 1 ? 0 : BASE_DELAY + (requestCount - 2) * DELAY_INCREMENT

  // If the toast hasn't been initialized, create it immediately.
  if (!initDone) {
    createToast(config)
  } else {
    setTimeout(() => config$.next(config), timeoutDelay)
  }

  // Clear any existing timer for auto-hiding the toast.
  if (lastTimer) {
    clearTimeout(lastTimer)
    lastTimer = undefined
  }

  lastTimer = config.timer ? setTimeout(() => closeToast(), config.timer) : undefined

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
    // Unmount immediately if the toast is closed.
    if (!config) {
      setMount(false)
      return
    }
    if (isOpen) {
      setMount(true)
      return
    }
  }, [isOpen, config])

  return (
    <>
      {mount && config && (
        <Toast
          label={config.body}
          open={isOpen}
          onClickClose={closeToast}
          actions={config.actions}
          walletInfo={config.walletInfo}
          openWalletAction={config.openWalletAction}
        />
      )}
    </>
  )
}

export { closeToast, openToast }
