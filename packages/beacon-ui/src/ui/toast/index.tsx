import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Subject } from '../../utils/subject'
import Toast from 'src/components/toast'
import { ToastConfig } from '../common'

let initDone: boolean = false
const render$ = new Subject<ToastConfig | undefined>()

const createToast = () => {
  const el = document.createElement('beacon-toast')
  document.body.prepend(el)
  setTimeout(() => createRoot(el).render(<ToastRoot />), 50)
  initDone = true
}

const openToast = (config: ToastConfig) => {
  !initDone && createToast()
  render$.next(config)
}

const closeToast = () => {
  render$.next(undefined)
}

const ToastRoot = () => {
  const [config, setConfig] = useState<ToastConfig | undefined>(undefined)
  useEffect(() => {
    const sub = render$.subscribe((config) => {
      setConfig(config)
    })
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!config || !config.timer) {
      return
    }

    const id = setTimeout(() => {
      setConfig(undefined) // Hide the toast
    }, config.timer)

    return () => clearTimeout(id)
  }, [config?.timer])

  return (
    <>
      {config && (
        <Toast
          label={config.body}
          open={!!config}
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
