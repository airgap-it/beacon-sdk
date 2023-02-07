import { Component, createSignal } from 'solid-js'
import { hydrate, render, renderToString } from 'solid-js/web'
import { WalletInfo } from '@airgap/beacon-types'

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
  const [state, setState] = createSignal('YES SIR')
  return (
    <div style={{ position: 'fixed', top: 0 }}>
      <h1>Toast Component {state()}</h1>
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
    const wrapper = document.createElement('div')
    wrapper.setAttribute('id', 'beacon-toast-wrapper')
    document.body.appendChild(wrapper)
    dispose = render(() => <Toast />, wrapper)
    setIsOpen(true)
  }
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    console.log('closeToast')
    if (dispose && isOpen()) {
      dispose()
      document.getElementById('beacon-toast-wrapper')?.remove()
      setIsOpen(false)
    }
    resolve()
  })

export { closeToast, openToast }
