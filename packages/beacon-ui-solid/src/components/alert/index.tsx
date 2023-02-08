import { Component, createSignal, onCleanup } from 'solid-js'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'
import styles from './styles.css'
import { render } from 'solid-js/web'
import { CloseIcon, LeftIcon, LogoIcon } from '../icons'

export interface AlertProps {}

export interface AlertButton {
  text: string
  style?: 'solid' | 'outline'
  actionCallback?(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  data?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
}

const [isOpen, setIsOpen] = createSignal<boolean>(false)
type VoidFunction = () => void
let dispose: null | VoidFunction = null

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (id: string): Promise<void> => {
  return new Promise(async (resolve) => {
    if (dispose && isOpen()) {
      setIsOpen(false)
      setTimeout(() => {
        if (dispose) dispose()
        document.getElementById('beacon-toast-wrapper')?.remove()
      }, 500)
    }
    resolve()
  })
}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  return (
    <div class={isOpen() ? 'wrapper-show' : 'wrapper-hide'}>
      <div class={isOpen() ? 'modal-show' : 'modal-hide'}>
        <div class="header">
          <div class="button-icon">
            <LeftIcon />
          </div>
          <div class="logo">
            <LogoIcon />
          </div>
          <div class="button-icon" onClick={() => closeAlert('')}>
            <CloseIcon />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alert

/**
 * Close all alerts
 */
const closeAlerts = async (): Promise<void> =>
  new Promise(async (resolve) => {
    console.log('closeAlerts')
    resolve()
  })

/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
// eslint-disable-next-line complexity
const openAlert = async (alertConfig: AlertConfig): Promise<string> => {
  if (!isOpen()) {
    const shadowRootEl = document.createElement('div')
    shadowRootEl.setAttribute('id', 'beacon-alert-wrapper')
    shadowRootEl.style.height = '0px'
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = styles
    shadowRoot.appendChild(style)
    dispose = render(() => <Alert />, shadowRoot)
    document.body.prepend(shadowRootEl)
    setTimeout(() => {
      setIsOpen(true)
    }, 50)
  }
  return ''
}

export { closeAlert, closeAlerts, openAlert }
