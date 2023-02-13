import { Component, createSignal, onCleanup } from 'solid-js'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'
import { render } from 'solid-js/web'

import { desktopList, extensionList, iOSList, webList } from './wallet-lists'

import Alert from '../../components/alert'
import TopWallets from '../../components/top-wallets'
import Wallets from '../../components/wallets'
import Info from '../../components/info'
import QR from '../../components/qr'

import * as alertStyles from '../../components/alert/styles.css'
import * as topWalletsStyles from '../../components/top-wallets/styles.css'
import * as walletsStyles from '../../components/wallets/styles.css'
import * as walletStyles from '../../components/wallet/styles.css'
import * as infoStyles from '../../components/info/styles.css'
import * as qrStyles from '../../components/qr/styles.css'

// Interfaces
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

// State variables
const [isOpen, setIsOpen] = createSignal<boolean>(false)
const [isInfo, setIsInfo] = createSignal<boolean>(false)
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
        document.getElementById('beacon-alert-wrapper')?.remove()
      }, 500)
    }
    resolve()
  })
}

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
    // Shadow root
    const shadowRootEl = document.createElement('div')
    shadowRootEl.setAttribute('id', 'beacon-alert-wrapper')
    shadowRootEl.style.height = '0px'
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })

    // Alert styles
    const style = document.createElement('style')
    style.textContent = alertStyles.default
    shadowRoot.appendChild(style)

    // Top Wallets styles
    const style2 = document.createElement('style')
    style2.textContent = topWalletsStyles.default
    shadowRoot.appendChild(style2)

    // Wallets styles
    const style3 = document.createElement('style')
    style3.textContent = walletsStyles.default
    shadowRoot.appendChild(style3)

    // Wallet styles
    const style4 = document.createElement('style')
    style4.textContent = walletStyles.default
    shadowRoot.appendChild(style4)

    // Info styles
    const style5 = document.createElement('style')
    style5.textContent = infoStyles.default
    shadowRoot.appendChild(style5)

    // QR styles
    const style6 = document.createElement('style')
    style6.textContent = qrStyles.default
    shadowRoot.appendChild(style6)

    const wallets = [
      ...desktopList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Desktop App'
        }
      }),
      ...extensionList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Browser Extension'
        }
      }),
      ...iOSList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'iOS App'
        }
      }),
      ...webList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Web App'
        }
      })
    ]

    dispose = render(
      () => (
        <Alert
          open={isOpen()}
          content={
            isInfo() ? (
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.9em' }}>
                <Info
                  title="Install Temple Wallet"
                  description="To connect your Temple Wallet, install the browser extension."
                  buttons={[
                    {
                      label: 'Install extension',
                      type: 'primary',
                      onClick: () => console.log('clicked button')
                    }
                  ]}
                />
                <QR />
              </div>
            ) : (
              <TopWallets
                wallets={wallets}
                onClickWallet={(id: string) => {
                  console.log('clicked on wallet', id)
                  setIsInfo(true)
                }}
              />
            )
          }
          extraContent={
            isInfo() ? undefined : (
              <Wallets
                wallets={wallets}
                onClickWallet={(id: string) => {
                  console.log('clicked on wallet', id)
                  setIsInfo(true)
                }}
              />
            )
          }
          onCloseClick={() => closeAlert('')}
          onBackClick={isInfo() ? () => setIsInfo(false) : undefined}
        />
      ),
      shadowRoot
    )
    document.body.prepend(shadowRootEl)
    setTimeout(() => {
      setIsOpen(true)
    }, 50)
  }
  return ''
}

export { closeAlert, closeAlerts, openAlert }
