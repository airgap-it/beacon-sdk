import { createSignal } from 'solid-js'
import { isServer, render } from 'solid-js/web'
import { WalletInfo } from '@mavrykdynamics/beacon-types'
import { generateGUID } from '@mavrykdynamics/beacon-utils'

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

// GLOBAL VARIABLES
type VoidFunction = () => void
let dispose: null | VoidFunction = null
const [isOpen, setIsOpen] = createSignal<boolean>(false)
const [renderLast, setRenderLast] = createSignal<string>('')

const ANIMATION_TIME = 300
let globalTimeout: NodeJS.Timeout

const createToast = (config: ToastConfig) => {
  const shadowRootEl = document.createElement('div')
  if (document.getElementById('beacon-toast-wrapper')) {
    (document.getElementById('beacon-toast-wrapper') as HTMLElement).remove()
  }
  shadowRootEl.setAttribute('id', 'beacon-toast-wrapper')
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

  // Inject font styles
  const styleFonts = document.createElement('style')
  styleFonts.textContent =
    "* { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;}"
  shadowRoot.appendChild(styleFonts)

  dispose = render(
    () => (
      <Toast
        label={config.body}
        open={isOpen()}
        onClickClose={() => {
          closeToast()
        }}
        actions={config.actions}
        walletInfo={config.walletInfo}
        openWalletAction={config.openWalletAction}
      />
    ),
    shadowRoot
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
    if (isServer) {
      console.log('DO NOT RUN ON SERVER')
      resolve()
    }
    setIsOpen(false)
    setTimeout(() => {
      if (dispose) dispose()
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
  if (isServer) {
    console.log('DO NOT RUN ON SERVER')
    return
  }

  const id = await generateGUID()
  setRenderLast(id)

  await closeToast()
  if (id === renderLast()) createToast(config)
}

export { closeToast, openToast }
