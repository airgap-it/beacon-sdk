import { createSignal } from 'solid-js'
import { isServer, render } from 'solid-js/web'
import { WalletInfo } from '@airgap/beacon-types'

import Toast from '../../components/toast'

import * as toastStyles from '../../components/toast/styles.css'
import * as loaderStyles from '../../components/loader/styles.css'

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

const [isOpen, setIsOpen] = createSignal<boolean>(false)

// EVENT HANDLERS
type VoidFunction = () => void
let dispose: null | VoidFunction = null

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (_: ToastConfig): Promise<void> => {
  if (isServer) {
    console.log('DO NOT RUN ON SERVER')
    return
  }

  if (!isOpen()) {
    const shadowRootEl = document.createElement('div')
    shadowRootEl.setAttribute('id', 'beacon-alert-wrapper')
    shadowRootEl.style.height = '0px'
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })

    // Toast styles
    const style = document.createElement('style')
    style.textContent = toastStyles.default
    shadowRoot.appendChild(style)

    // Loader styles
    const style2 = document.createElement('style')
    style2.textContent = loaderStyles.default
    shadowRoot.appendChild(style2)

    dispose = render(() => <Toast open={isOpen()} />, shadowRoot)
    document.body.prepend(shadowRootEl)
    setTimeout(() => {
      setIsOpen(true)
    }, 50)
  }
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    if (isServer) {
      console.log('DO NOT RUN ON SERVER')
      resolve()
    }
    if (dispose && isOpen()) {
      setIsOpen(false)
      setTimeout(() => {
        if (dispose) dispose()
        if (document.getElementById('beacon-toast-wrapper'))
          (document.getElementById('beacon-toast-wrapper') as HTMLElement).remove()
      }, 500)
    }
    resolve()
  })

export { closeToast, openToast }
