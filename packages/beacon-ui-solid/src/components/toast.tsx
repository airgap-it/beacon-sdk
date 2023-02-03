import { Component } from 'solid-js'
import { WalletInfo } from '@airgap/beacon-types'

export interface ToastProps {}

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

const Toast: Component<ToastProps> = (props: ToastProps) => {
  return (
    <div>
      <h1>Toast Component</h1>
    </div>
  )
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    console.log('closeToast')
    resolve()
  })

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (toastConfig: ToastConfig): Promise<void> => {
  console.log('openToast')
}

export { closeToast, openToast }
