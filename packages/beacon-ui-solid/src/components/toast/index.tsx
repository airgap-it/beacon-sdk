import { Component, createSignal } from 'solid-js'
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

// COMPONENT
export interface ToastProps {}

const Toast: Component<ToastProps> = (props: ToastProps) => {
  const [state, setState] = createSignal<number>(0)
  return (
    <div class={'wrapper'}>
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
const [isOpen, setIsOpen] = createSignal<boolean>(false)

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
    setIsOpen(true)
  }
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    if (dispose && isOpen()) {
      dispose()
      document.getElementById('beacon-toast-wrapper')?.remove()
      setIsOpen(false)
    }
    resolve()
  })

export { closeToast, openToast }
