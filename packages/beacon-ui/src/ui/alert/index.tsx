import { createSignal } from 'solid-js'
import {
  NetworkType,
  P2PPairingRequest,
  PostMessagePairingRequest,
  WalletConnectPairingRequest
} from '@airgap/beacon-types'
import { isServer, render } from 'solid-js/web'
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
import { Serializer } from '@airgap/beacon-core'
import { arrangeTop4, MergedWallet, mergeWallets, parseWallets, Wallet } from 'src/utils/wallets'

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
    walletConnectSyncCode: () => Promise<WalletConnectPairingRequest>
    preferredNetwork: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
}

// State variables
const [isOpen, setIsOpen] = createSignal<boolean>(false)
const [codeQR, setCodeQR] = createSignal<string>('')
const [currentWallet, setCurrentWallet] = createSignal<MergedWallet | undefined>(undefined)
const [previousInfo, setPreviousInfo] = createSignal<
  'top-wallets' | 'wallets' | 'install' | 'help'
>('top-wallets')
const [currentInfo, setCurrentInfo] = createSignal<'top-wallets' | 'wallets' | 'install' | 'help'>(
  'top-wallets'
)

type VoidFunction = () => void
let dispose: null | VoidFunction = null

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (_: string): Promise<void> => {
  return new Promise(async (resolve) => {
    if (isServer) {
      console.log('DO NOT RUN ON SERVER')
      resolve()
    }

    if (dispose && isOpen()) {
      setIsOpen(false)
      setTimeout(() => {
        if (dispose) dispose()
        if (document.getElementById('beacon-alert-wrapper'))
          (document.getElementById('beacon-alert-wrapper') as HTMLElement).remove()
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
    if (isServer) {
      console.log('DO NOT RUN ON SERVER')
      resolve()
    }

    if (dispose && isOpen()) {
      setIsOpen(false)
      setTimeout(() => {
        if (dispose) dispose()
        if (document.getElementById('beacon-alert-wrapper'))
          (document.getElementById('beacon-alert-wrapper') as HTMLElement).remove()
      }, 500)
    }
    resolve()
  })

/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
// eslint-disable-next-line complexity
const openAlert = async (config: AlertConfig): Promise<string> => {
  console.log('config', config)

  const setDefaultPayload = async () => {
    if (config.pairingPayload) {
      const serializer = new Serializer()
      const codeQR = await serializer.serialize(await config.pairingPayload.p2pSyncCode())
      setCodeQR(codeQR)
    }
  }
  setDefaultPayload()

  if (isServer) {
    console.log('DO NOT RUN ON SERVER')
    return ''
  }

  if (!isOpen()) {
    setCurrentInfo('top-wallets')
    setCurrentWallet(undefined)

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

    const wallets: Wallet[] = [
      ...desktopList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Desktop App',
          type: 'desktop',
          link: wallet.deepLink
        }
      }),
      ...extensionList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Browser Extension',
          type: 'extension',
          link: wallet.link
        }
      }),
      ...iOSList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Mobile App',
          supportedInteractionStandards: wallet.supportedInteractionStandards,
          type: 'ios',
          link: wallet.universalLink
        }
      }),
      ...webList.map((wallet) => {
        return {
          id: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Web App',
          type: 'web',
          link: wallet.links.mainnet
        }
      })
    ]

    const parsedWallets = parseWallets(wallets)

    const mergedWallets = mergeWallets(parsedWallets)

    const arrangedWallets = arrangeTop4(
      mergedWallets,
      'kukai_web',
      'trust_ios',
      'temple_chrome',
      'umami_desktop'
    )

    const isMobile = window.innerWidth <= 800

    const handleClickLearnMore = () => {
      setPreviousInfo(currentInfo())
      setCurrentInfo('help')
    }

    const handleCloseAlert = () => {
      closeAlert('')
      if (config.closeButtonCallback) config.closeButtonCallback()
    }

    const handleClickWallet = async (id: string) => {
      const wallet = arrangedWallets.find((wallet) => wallet.id === id)
      setCurrentWallet(wallet)

      if (wallet?.types.includes('web')) {
        window.open(wallet.link, '_blank')
        return
      }
      if (wallet && wallet.supportedInteractionStandards?.includes('wallet_connect')) {
        const uri = (await config?.pairingPayload?.walletConnectSyncCode())?.uri

        if (uri) {
          setCodeQR(uri)
        }
      } else {
        setDefaultPayload()
      }
      setCurrentInfo('install')
    }

    dispose = render(
      () => (
        <>
          {config.pairingPayload && (
            <Alert
              open={isOpen()}
              content={
                currentInfo() === 'install' ? (
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.9em' }}>
                    {!isMobile && currentWallet()?.types.includes('extension') && (
                      <Info
                        border
                        title={`Install ${currentWallet()?.name} Wallet`}
                        description={`To connect your ${
                          currentWallet()?.name
                        } Wallet, install the browser extension.`}
                        buttons={[
                          {
                            label: 'Install extension',
                            type: 'primary',
                            onClick: () => console.log('clicked button')
                          }
                        ]}
                      />
                    )}
                    {!isMobile && currentWallet()?.types.includes('desktop') && (
                      <Info
                        border
                        title={`Open Desktop App`}
                        description={`If you don't have the desktop app installed, click below to download it.`}
                        buttons={[
                          {
                            label: 'Open desktop app',
                            type: 'primary',
                            onClick: () => console.log('clicked button')
                          },
                          {
                            label: 'Download desktop app',
                            type: 'secondary',
                            onClick: () => console.log('clicked button')
                          }
                        ]}
                      />
                    )}
                    {!isMobile &&
                      currentWallet()?.types.includes('ios') &&
                      (currentWallet()?.types.length as number) > 1 && (
                        <QR
                          isMobile={false}
                          walletName={currentWallet()?.name || 'Airgap'}
                          code={codeQR()}
                          onClickLearnMore={handleClickLearnMore}
                        />
                      )}
                    {!isMobile &&
                      currentWallet()?.types.includes('ios') &&
                      (currentWallet()?.types.length as number) <= 1 && (
                        <QR
                          isMobile={true}
                          walletName={currentWallet()?.name || 'Airgap'}
                          code={codeQR()}
                          onClickLearnMore={handleClickLearnMore}
                        />
                      )}
                    {isMobile && (
                      <QR
                        isMobile={true}
                        walletName={currentWallet()?.name || 'Airgap'}
                        code={codeQR()}
                        onClickLearnMore={handleClickLearnMore}
                      />
                    )}
                  </div>
                ) : currentInfo() === 'wallets' && isMobile ? (
                  <Wallets
                    wallets={arrangedWallets.slice(-(arrangedWallets.length - 4))}
                    onClickWallet={handleClickWallet}
                  />
                ) : currentInfo() === 'help' ? (
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.9em' }}>
                    <Info
                      iconBadge
                      icon={
                        <svg
                          fill="currentColor"
                          stroke-width="0"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          height="1em"
                          width="1em"
                          style="overflow: visible;"
                          color="white"
                        >
                          <path d="M16 12h2v4h-2z"></path>
                          <path d="M20 7V5c0-1.103-.897-2-2-2H5C3.346 3 2 4.346 2 6v12c0 2.201 1.794 3 3 3h15c1.103 0 2-.897 2-2V9c0-1.103-.897-2-2-2zM5 5h13v2H5a1.001 1.001 0 0 1 0-2zm15 14H5.012C4.55 18.988 4 18.805 4 18V8.815c.314.113.647.185 1 .185h15v10z"></path>
                        </svg>
                      }
                      title="What is a wallet?"
                      description="Wallets let you send, receive, store an interact with digital assets. Your wallet can be used as an easy way to login, instead of having to remember a password."
                    />
                    <Info
                      iconBadge
                      icon={
                        <svg
                          fill="none"
                          stroke-width="2"
                          xmlns="http://www.w3.org/2000/svg"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          viewBox="0 0 24 24"
                          height="1em"
                          width="1em"
                          style="overflow: visible;"
                          color="white"
                        >
                          <path stroke="none" d="M0 0h24v24H0z"></path>
                          <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                          <path d="M9 12h6M12 9v6"></path>
                        </svg>
                      }
                      title="Not sure where to start?"
                      description="If you are new to the Web3, we recommend that you start by creating a Kukai wallet. Kukai is a fast way of creating your first wallet using your preffered social account."
                      buttons={[
                        {
                          label: 'Get started',
                          type: 'primary',
                          onClick: () => console.log('clicked button')
                        }
                      ]}
                    />
                  </div>
                ) : (
                  <TopWallets
                    wallets={isMobile ? arrangedWallets.slice(0, 3) : arrangedWallets.slice(0, 4)}
                    onClickWallet={handleClickWallet}
                    onClickLearnMore={handleClickLearnMore}
                    otherWallets={
                      isMobile
                        ? {
                            images: [
                              arrangedWallets[3].image,
                              arrangedWallets[4].image,
                              arrangedWallets[5].image
                            ],
                            onClick: () => setCurrentInfo('wallets')
                          }
                        : undefined
                    }
                  />
                )
              }
              extraContent={
                currentInfo() !== 'top-wallets' || isMobile ? undefined : (
                  <Wallets
                    small
                    wallets={arrangedWallets.slice(-(arrangedWallets.length - 4))}
                    onClickWallet={handleClickWallet}
                  />
                )
              }
              onCloseClick={() => handleCloseAlert()}
              onBackClick={
                currentInfo() === 'install' && !isMobile
                  ? () => setCurrentInfo('top-wallets')
                  : currentInfo() === 'install' && isMobile
                  ? () => setCurrentInfo('wallets')
                  : currentInfo() === 'wallets' && isMobile
                  ? () => setCurrentInfo('top-wallets')
                  : currentInfo() === 'help'
                  ? () => setCurrentInfo(previousInfo())
                  : undefined
              }
            />
          )}
          {!config.pairingPayload && (
            <Alert
              open={isOpen()}
              content={
                <Info
                  icon={
                    <svg
                      color="#334155"
                      fill="currentColor"
                      stroke-width="0"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                      height="1em"
                      width="1em"
                      style="overflow: visible;"
                    >
                      <path d="m955.7 856-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zM480 416c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v184c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V416zm32 352a48.01 48.01 0 0 1 0-96 48.01 48.01 0 0 1 0 96z"></path>
                    </svg>
                  }
                  title={config.title || 'No title'}
                  description={config.body || 'No description'}
                  buttons={[
                    {
                      label: 'Close',
                      type: 'primary',
                      onClick: () => handleCloseAlert()
                    }
                  ]}
                />
              }
              onCloseClick={() => handleCloseAlert()}
            />
          )}
        </>
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
