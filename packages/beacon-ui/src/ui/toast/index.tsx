import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WalletInfo } from '@airgap/beacon-types'
import { generateGUID } from '@airgap/beacon-utils'

import Toast from '../../components/toast'

// INTERFACES
export interface ToastAction {
  text: string
  isBold?: boolean
  actionText?: string
  actionLogo?: 'external'
  actionCallback?(): Promise<void>
}

export interface ToastConfig {
  body: string
  timer?: number
  forceNew?: boolean
  state: 'prepare' | 'loading' | 'acknowledge' | 'finished'
  actions?: ToastAction[]
  walletInfo?: WalletInfo
  openWalletAction?(): Promise<void>
}

const useToastState = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [renderLast, setRenderLast] = useState<string>('')

  return {
    isOpen,
    setIsOpen,
    renderLast,
    setRenderLast
  }
}

const ANIMATION_TIME = 300
let globalTimeout: NodeJS.Timeout

const createToast = (config: ToastConfig) => {
  const { isOpen, setIsOpen } = useToastState()

  const shadowRootEl = document.createElement('div')
  if (document.getElementById('beacon-toast-wrapper')) {
    ;(document.getElementById('beacon-toast-wrapper') as HTMLElement).remove()
  }
  shadowRootEl.setAttribute('id', 'beacon-toast-wrapper')
  shadowRootEl.style.height = '0px'

  createRoot(shadowRootEl).render(
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
  )

  // Create toast
  document.body.prepend(shadowRootEl)

  // Open toast
  setTimeout(() => {
    setIsOpen(true)
  }, 50)

  // Add close timer if in config
  clearTimeout(globalTimeout)
  if (config.timer) {
    globalTimeout = setTimeout(() => closeToast(), config.timer)
  }
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    const { setIsOpen } = useToastState()

    if (typeof window === 'undefined') {
      console.log('DO NOT RUN ON SERVER')
      resolve()
    }
    setIsOpen(false)
    setTimeout(() => {
      if (document.getElementById('beacon-toast-wrapper'))
        (document.getElementById('beacon-toast-wrapper') as HTMLElement).remove()
      resolve()
    }, ANIMATION_TIME)
  })

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (config: ToastConfig): Promise<void> => {
  const { renderLast, setRenderLast } = useToastState()
  if (typeof window === 'undefined') {
    console.log('DO NOT RUN ON SERVER')
    return
  }

  const id = await generateGUID()
  setRenderLast(id)

  await closeToast()
  if (id === renderLast) createToast(config)
}

export { closeToast, openToast }
