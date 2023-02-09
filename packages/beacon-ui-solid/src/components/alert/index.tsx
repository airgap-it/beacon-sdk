import { Component, createSignal, onCleanup } from 'solid-js'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'
import { render } from 'solid-js/web'
import { CloseIcon, LeftIcon, LogoIcon } from '../icons'
import styles from './styles.css'

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

export interface AlertProps {}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  const [showMore, setShowMore] = createSignal<boolean>(false)
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
        <div class="body">
          <div class="info">
            <h3>Connect Wallet</h3>
            <p>
              If you don't have a wallet, you can select a provider and create one now. Learn more
            </p>
          </div>
          <div class="wallets-main">
            <div class="wallet">
              <h3>Test Wallet 1</h3>
              <div class="image"></div>
            </div>
            <div class="wallet">
              <h3>Test Wallet 2</h3>
              <div class="image"></div>
            </div>
            <div class="wallet">
              <h3>Test Wallet 3</h3>
              <div class="image"></div>
            </div>
            <div class="wallet">
              <h3>Test Wallet 4</h3>
              <div class="image"></div>
            </div>
          </div>
          <div class={showMore() ? 'wallets-extra-show' : 'wallets-extra-hide'}></div>
        </div>
        <div class="Footer">{showMore() ? 'Show more' : 'Show less'}</div>
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
