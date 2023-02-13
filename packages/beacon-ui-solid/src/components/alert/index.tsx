import { Component, createSignal, onCleanup } from 'solid-js'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'
import { render } from 'solid-js/web'

import { CloseIcon, LeftIcon, LogoIcon } from '../icons'
import TopWallets from '../top-wallets'
import Wallets from '../wallets'
import Info from '../info'
import QR from '../qr'

import styles from './styles.css'
import * as topWalletsStyles from '../top-wallets/styles.css'
import * as walletsStyles from '../wallets/styles.css'
import * as walletStyles from '../wallet/styles.css'
import * as infoStyles from '../info/styles.css'
import * as qrStyles from '../qr/styles.css'

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
        document.getElementById('beacon-toast-wrapper')?.remove()
      }, 500)
    }
    resolve()
  })
}

export interface AlertProps {
  content: any
  extraContent?: any
  onBackClick?: () => void
}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  const [showMore, setShowMore] = createSignal<boolean>(false)
  return (
    <div class={isOpen() ? 'alert-wrapper-show' : 'alert-wrapper-hide'}>
      <div class={isOpen() ? 'alert-modal-show' : 'alert-modal-hide'}>
        <div class="alert-header">
          {props.onBackClick && (
            <div class="alert-button-icon" onClick={props.onBackClick}>
              <LeftIcon />
            </div>
          )}
          <div class="alert-logo">
            <LogoIcon />
          </div>
          <div class="alert-button-icon" onClick={() => closeAlert('')}>
            <CloseIcon />
          </div>
        </div>
        <div class="alert-body" style={{ 'margin-bottom': props.extraContent ? '' : '1.8em' }}>
          {props.content}
          <div class={showMore() ? 'alert-body-extra-show' : 'alert-body-extra-hide'}>
            <div class="alert-divider"></div>
            {props.extraContent}
          </div>
        </div>
        {props.extraContent && (
          <div class="alert-footer" onClick={() => setShowMore(!showMore())}>
            {showMore() ? 'Show less' : 'Show more'}
          </div>
        )}
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
  console.log('alertConfig', alertConfig)
  if (!isOpen()) {
    const shadowRootEl = document.createElement('div')
    shadowRootEl.setAttribute('id', 'beacon-alert-wrapper')
    shadowRootEl.style.height = '0px'
    const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    const style2 = document.createElement('style')
    const style3 = document.createElement('style')
    const style4 = document.createElement('style')
    const style5 = document.createElement('style')
    const style6 = document.createElement('style')

    style.textContent = styles
    style2.textContent = topWalletsStyles.default
    style3.textContent = walletsStyles.default
    style4.textContent = walletStyles.default
    style5.textContent = infoStyles.default
    style6.textContent = qrStyles.default

    shadowRoot.appendChild(style)
    shadowRoot.appendChild(style2)
    shadowRoot.appendChild(style3)
    shadowRoot.appendChild(style4)
    shadowRoot.appendChild(style5)
    shadowRoot.appendChild(style6)

    const wallets = [
      {
        id: 'kukai',
        name: 'Kukai Wallet',
        description: 'Web App',
        image:
          'data:image/png;base64,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'
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        description: 'Mobile App',
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAHNklEQVR4Ae3BbWyUhQEA4Ofevg0f7d0RsAllEJSpQVy1K3SQIQro2HRoVIymS/Zj6w8xfk6NWzRzoJkO48d0MUaTZv6yMRFNxM2EIX4wIthSUJERgrCmjHZWCXdXapsWbgk/iLbvlXuPsgHjeZx11ln/1xJiaGjMV+NazMU0lDs1DKADm7GmuSnRqUgJRWhozF+AR7EMoVPbIFbjoeamxOeOI+E4Ghrzy/EMxjq99OGe5qbEi0ZQZgQNjfk/4HGETj8hltbUrRi3fevKdQooU0BDY345Hnf6u6ymbkXX9q0rt4gQiNDQmL8Azzhz/LGhMf9dEQLRHsVYZ46x+L0IgSEaGvPVWObMs6yhMV9tiNBw1yJ0EiQSVJ1D9WQmTmDsGEf19XPgIJ1ddH9JPu9kCHEtXvINoeHmGkXl5cyppb6Oiy8iWWlE2Rw7dtLSRus2BgaMprl4yTeEhptmFIwfz9VXsWQxyUpFSyWZV8+8enI9rF3P2+vo7TUaphkiNFy5IowZwyWzSCbZ287edsdcMZ+Gm0glnZBkJcuu40eLeOU1PtjomPOmM+Ncsjk+/Yy+fsUoN0SoBOfP4L7bSacds6mFtev56Y+ZXWtUpZIs/wX13+cva/nJlfxgtmMyGZ56nt17xBaKacwY7ruddNq3zKtnXr2TanYts2sNk05z3+3c8yD9/WIJxXTJLNJpJ+RQL51dZHOOSiWpnkzFeCVLp7lkFi1bxRKKadw4Jen+inc30NrGvv0iTZ3CnDoWLaBqktjGjRNbKKb2DrH0HOLV13lvA4ePGNG+/ezbz5q/snABt9xIZYWitXeILRBTewd/36QoO3fxwMO88z6Hjyja4SO88z4PPMzOXYqycTPtHWILlODFP/PxdiPa8jGPPc3BjJIdzPDY02z52Ii2fcoLTUoSKMHhw3T8S0E7d/HsCwwOOmGDgzz7Ajt3KWjffo4cUZJACcrLWThfpJ5DPPcig4NGzeAgz71IzyGRLv8h5eVKEijBnFoqK0V69XUOZhQlnSKVVJSDGV59XaRUkjm1ShIqQX2dSN1f8d4GI0qnuGEp8+pJJR2VzbGphTfeIpNV0HsbuO4aqiYZpr6OD1vEFogpkeB7s0R6dwOHjyjo/BmsWsmSxaSSjkklWbKYVSs5f4aCDh/h3Q0iXXwRiYTYAjFVnUNlhUitbQpKp7j/TlJJBaWS3H8n6ZSCWttESlZSdY7YAjFVTxbpUC/79ivohqWkko4rleSGpQrat59DvSJVTxZbIKaJE0Tq7DKiefWKNq/eiDq7RJo4QWyBmMaOESmbU1AqSSqpaKkkqaSCsjmRxo4RW+C/IJFwygrE1NcvUiqpoEyWbE7RsjmyOQWlkiL19YstENOBgyJVTzaiTS2KtqnFiKoni3TgoNgCMXV2iVQxnqlTFPTGW2Rzjiub4423FDR1ChXjRersElsgpu4v6Tkk0pw6BWWyPPknsjkFZbI8+ScyWQXNqRMp10P3l2ILxJTPs32HSIsWUBYoaPcefv071q4nm3NMNsfa9fxmBbv3KKgsYNECkT77B/m82EIlaGljXr1hqiaxcAHvvK+gTJaXX+HlV0glHZXNKcrCBVRNEqmlTUkCJWjdRk+PSLfcyIS0omRzZHOKMiHNLTeKlM3Ruk1JAiUYGOC9jSJVVnDXrYShUROG3HUrlRUifbCRgQElCZSgLGDqFAXNvJC7byMMnbAw5O7bmHmhgqZ+hyBQkkAJljdSW2NEsy/lwXuZkFayCWkevJfZlxpRbQ23NSpJIKbp05g/V1FmXsgTj3DlFZQFilYWcOUVPPEIMy9UlPlzmT5NbKGYpk8TS2UFjT/numt4dwOtbezbL9LUKcypY9ECqiaJbfo02jvEEorp66+VpGoSN1/PzddzqJfOLrI5R6WSVE+mYrwT8vXXYgvF9MkOMhnSaSWrGM/5M4yqTIZPdogtEFN/P089TybjWz7awiNPsGWbk2bLNh55go+2+JZMhqeep79fbKES7N7Drx6k5mJSSfb8k73tjtq5i8vn87ObSCWNimyOV17jg42O2rmL86Yz41yyOT79jL5+JQkNN6AIff20tIn0wUZat3L1VSxZTLJSSXI9rF3P2+vo7fUte9vZ2y6uAUOEhuswCnp7Wf0mb77NnFrq65g1k1TSiLI5duykpY3WbQwMGE0dhggNtxm/NEoGBviwhQ9bSCSoOofqyUycwNgxjurr58BBOrvo/pJ83smy2RCh4dbgeYRGWT7PF9180e1/YRBrDBEYorkp0YnVzjyrm5sSnYYIRPst+pw5+vCQCGUibN+68kBN3YqvsNSZ4Y7mpsTfRChTwPatK1tr6laMw2VOb6uamxKrFFBmBNu3rlxXU7fi37gKodNLH+5obkqsMoKEIjQ05i/Ao1iG0KltEKvxUHNT4nPHkRBDQ2O+GtdiLqah3KlhAB3YjDXNTYlOZ5111llF+A8aUDCF69BprwAAAABJRU5ErkJggg=='
      },
      {
        id: 'temple',
        name: 'Temple Wallet',
        description: 'Browser Extenion & Mobile App',
        image: 'https://templewallet.com/logo.png'
      },
      {
        id: 'umami',
        name: 'Umami',
        description: 'Mobile/Desktop App',
        image:
          'data:image/png;base64,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'
      }
    ]

    dispose = render(
      () => (
        <Alert
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
                  console.log('cllicked on wallet', id)
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
                  console.log('cllicked on wallet', id)
                  setIsInfo(true)
                }}
              />
            )
          }
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
