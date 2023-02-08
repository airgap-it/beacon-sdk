import { Component, createSignal, onCleanup, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { WalletInfo } from '@airgap/beacon-types'
import styles from './styles.css'

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

// COMPONENT
export interface ToastProps {}

const Toast: Component<ToastProps> = (props: ToastProps) => {
  const [state, setState] = createSignal<number>(0)

  return (
    <div class={isOpen() ? 'wrapper-show' : 'wrapper-hide'}>
      <h1>Counter: {state()}</h1>
      <button class={'button'} onClick={() => setState(state() + 1)}>
        Increment
      </button>
    </div>
  )
}

// EVENT HANDLERS
type VoidFunction = () => void
let dispose: null | VoidFunction = null

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (toastConfig: ToastConfig): Promise<void> => {
  if (!isOpen()) {
    const shadowRootEl = document.createElement('div')
    shadowRootEl.setAttribute('id', 'beacon-toast-wrapper')
    shadowRootEl.style.height = '0px'
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = styles
    shadowRoot.appendChild(style)
    dispose = render(() => <Toast />, shadowRoot)
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
    if (dispose && isOpen()) {
      setIsOpen(false)
      setTimeout(() => {
        if (dispose) dispose()
        document.getElementById('beacon-toast-wrapper')?.remove()
      }, 500)
    }
    resolve()
  })

export { closeToast, openToast }
