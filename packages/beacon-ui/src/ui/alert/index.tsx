import { createSignal } from 'solid-js'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
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
import { Serializer, windowRef } from '@airgap/beacon-core'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import { arrangeTop4, MergedWallet, mergeWallets, parseWallets, Wallet } from 'src/utils/wallets'
import { getTzip10Link } from 'src/utils/get-tzip10-link'

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
const [showMoreContent, setShowMoreContent] = createSignal<boolean>(false)
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
  if (isServer) {
    console.log('DO NOT RUN ON SERVER')
    return ''
  }

  if (!isOpen()) {
    const availableExtensions = await PostMessageTransport.getAvailableExtensions()

    const setDefaultPayload = async () => {
      if (config.pairingPayload) {
        const serializer = new Serializer()
        const codeQR = await serializer.serialize(await config.pairingPayload.p2pSyncCode())
        setCodeQR(codeQR)
      }
    }

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
          key: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Desktop App',
          type: 'desktop',
          link: wallet.downloadLink,
          deepLink: wallet.deepLink
        }
      }),
      ...extensionList.map((wallet) => {
        return {
          id: wallet.id,
          key: wallet.key,
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
          key: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Mobile App',
          supportedInteractionStandards: wallet.supportedInteractionStandards,
          type: 'ios',
          link: wallet.universalLink,
          deepLink: wallet.deepLink
        }
      }),
      ...webList.map((wallet) => {
        return {
          id: wallet.key,
          key: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Web App',
          type: 'web',
          link: wallet.links.mainnet
        }
      })
    ]

    // Parse wallet names
    const parsedWallets = parseWallets(wallets)

    // Merge wallets by name
    const mergedWallets = mergeWallets(parsedWallets)

    // Sort wallets by top4
    const arrangedWallets = arrangeTop4(
      mergedWallets,
      'kukai_web',
      'trust_ios',
      'temple_chrome',
      'umami_desktop'
    )

    const isMobile = window.innerWidth <= 800

    const handleClickShowMoreContent = () => {
      setShowMoreContent(!showMoreContent())
    }

    const handleClickLearnMore = () => {
      setPreviousInfo(currentInfo())
      setCurrentInfo('help')
      setShowMoreContent(false)
    }

    const handleCloseAlert = () => {
      closeAlert('')
      if (config.closeButtonCallback) config.closeButtonCallback()
    }

    const handleClickWallet = async (id: string) => {
      setShowMoreContent(false)
      const wallet = arrangedWallets.find((wallet) => wallet.id === id)
      setCurrentWallet(wallet)

      if (wallet?.types.includes('web')) {
        if (config.pairingPayload) {
          const serializer = new Serializer()
          const code = await serializer.serialize(await config.pairingPayload.p2pSyncCode())
          const link = getTzip10Link(wallet.link, code)
          window.open(link, '_blank')
        }
        return
      }

      if (wallet && wallet.supportedInteractionStandards?.includes('wallet_connect')) {
        const uri = (await config?.pairingPayload?.walletConnectSyncCode())?.uri

        if (uri) {
          setCodeQR(uri)
        }
        setCurrentInfo('install')
      } else if (wallet?.types.includes('ios') && isMobile) {
        setCodeQR('')

        if (config.pairingPayload) {
          const serializer = new Serializer()
          const code = await serializer.serialize(await config.pairingPayload.p2pSyncCode())

          const link = getTzip10Link(wallet.deepLink ?? wallet.link, code)

          // iOS does not trigger deeplinks with `window.open(...)`. The only way is using a normal link. So we have to work around that.
          const a = document.createElement('a')
          a.setAttribute('href', link)
          a.dispatchEvent(
            new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
          )
        }
      } else {
        await setDefaultPayload()
        setCurrentInfo('install')
      }
    }

    const handleClickOther = async () => {
      setShowMoreContent(false)
      setCurrentWallet({
        ...arrangedWallets[0],
        name: '',
        types: ['ios']
      })
      setDefaultPayload()
      setCurrentInfo('install')
    }

    const handleClickConnectExtension = async () => {
      setShowMoreContent(false)
      if (config.pairingPayload?.postmessageSyncCode) {
        const serializer = new Serializer()
        const postmessageCode = await serializer.serialize(
          await config.pairingPayload.postmessageSyncCode()
        )
        const message: ExtensionMessage<string> = {
          target: ExtensionMessageTarget.EXTENSION,
          payload: postmessageCode,
          targetId: currentWallet()?.id
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        windowRef.postMessage(message as any, windowRef.location.origin)
      }
    }

    const handleClickInstallExtension = async () => {
      setShowMoreContent(false)
      window.open(currentWallet()?.link || '', '_blank')
    }

    const handleClickOpenDesktopApp = async () => {
      setShowMoreContent(false)

      if (config.pairingPayload?.p2pSyncCode) {
        const serializer = new Serializer()
        const code = await serializer.serialize(await config.pairingPayload?.p2pSyncCode())
        const link = getTzip10Link(currentWallet()?.deepLink || '', code)
        window.open(link, '_blank')
      }
    }

    const handleClickDownloadDesktopApp = async () => {
      setShowMoreContent(false)
      window.open(currentWallet()?.link || '', '_blank')
    }

    const hasExtension = () =>
      availableExtensions.map((extension) => extension.id).includes(currentWallet()?.id || '')

    dispose = render(
      () => (
        <>
          {config.pairingPayload && (
            <Alert
              open={isOpen()}
              showMore={showMoreContent()}
              content={
                <div>
                  <div
                    style={
                      currentInfo() === 'install'
                        ? {
                            opacity: 1,
                            height: 'unset',
                            overflow: 'unset',
                            transform: 'scale(1)',
                            transition: 'all ease 0.3s',
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '0.9em'
                          }
                        : {
                            opacity: 0,
                            height: 0,
                            overflow: 'hidden',
                            transform: 'scale(1.1)',
                            transition: 'all ease 0.3s',
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '0.9em'
                          }
                    }
                  >
                    {!isMobile && currentWallet()?.types.includes('extension') && (
                      <Info
                        border
                        title={
                          hasExtension()
                            ? `Use Browser Extension`
                            : `Install ${currentWallet()?.name} Wallet`
                        }
                        description={
                          hasExtension()
                            ? `Please connect below to use your ${
                                currentWallet()?.name
                              } Wallet browser extension.`
                            : `To connect your ${
                                currentWallet()?.name
                              } Wallet, install the browser extension.`
                        }
                        buttons={
                          hasExtension()
                            ? [
                                {
                                  label: 'Connect now',
                                  type: 'primary',
                                  onClick: () => handleClickConnectExtension()
                                }
                              ]
                            : [
                                {
                                  label: 'Install extension',
                                  type: 'primary',
                                  onClick: () => handleClickInstallExtension()
                                }
                              ]
                        }
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
                            onClick: () => handleClickOpenDesktopApp()
                          },
                          {
                            label: 'Download desktop app',
                            type: 'secondary',
                            onClick: () => handleClickDownloadDesktopApp()
                          }
                        ]}
                      />
                    )}
                    {!isMobile &&
                      codeQR().length > 0 &&
                      currentWallet()?.types.includes('ios') &&
                      (currentWallet()?.types.length as number) > 1 && (
                        <QR
                          isWalletConnect={
                            currentWallet()?.supportedInteractionStandards?.includes(
                              'wallet_connect'
                            ) || false
                          }
                          isMobile={false}
                          walletName={currentWallet()?.name || 'Airgap'}
                          code={codeQR()}
                          onClickLearnMore={handleClickLearnMore}
                        />
                      )}
                    {!isMobile &&
                      codeQR().length > 0 &&
                      currentWallet()?.types.includes('ios') &&
                      (currentWallet()?.types.length as number) <= 1 && (
                        <QR
                          isWalletConnect={
                            currentWallet()?.supportedInteractionStandards?.includes(
                              'wallet_connect'
                            ) || false
                          }
                          isMobile={true}
                          walletName={currentWallet()?.name || 'Airgap'}
                          code={codeQR()}
                          onClickLearnMore={handleClickLearnMore}
                        />
                      )}
                    {isMobile && codeQR().length > 0 && (
                      <QR
                        isWalletConnect={
                          currentWallet()?.supportedInteractionStandards?.includes(
                            'wallet_connect'
                          ) || false
                        }
                        isMobile={true}
                        walletName={currentWallet()?.name || 'Airgap'}
                        code={codeQR()}
                        onClickLearnMore={handleClickLearnMore}
                      />
                    )}
                  </div>
                  <div
                    style={
                      currentInfo() === 'wallets'
                        ? {
                            opacity: 1,
                            height: 'unset',
                            overflow: 'unset',
                            transform: 'scale(1)',
                            transition: 'all ease 0.3s'
                          }
                        : {
                            opacity: 0,
                            height: 0,
                            overflow: 'hidden',
                            transform: 'scale(1.1)',
                            transition: 'all ease 0.3s'
                          }
                    }
                  >
                    <Wallets
                      wallets={arrangedWallets.slice(-(arrangedWallets.length - 4))}
                      onClickWallet={handleClickWallet}
                      onClickOther={handleClickOther}
                    />
                  </div>
                  <div
                    style={
                      currentInfo() === 'help'
                        ? {
                            opacity: 1,
                            height: 'unset',
                            overflow: 'unset',
                            transform: 'scale(1)',
                            transition: 'all ease 0.3s',
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '0.9em'
                          }
                        : {
                            opacity: 0,
                            height: 0,
                            overflow: 'hidden',
                            transform: 'scale(1.1)',
                            transition: 'all ease 0.3s',
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '0.9em'
                          }
                    }
                  >
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
                      description="Wallets let you send, receive, store and interact with digital assets. Your wallet can be used as an easy way to login, instead of having to remember a password."
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
                    />
                  </div>
                  <div
                    style={
                      currentInfo() !== 'install' &&
                      currentInfo() !== 'wallets' &&
                      currentInfo() !== 'help'
                        ? {
                            opacity: 1,
                            height: 'unset',
                            overflow: 'unset',
                            transform: 'scale(1)',
                            transition: 'all ease 0.3s'
                          }
                        : {
                            opacity: 0,
                            height: 0,
                            overflow: 'hidden',
                            transform: 'scale(1.1)',
                            transition: 'all ease 0.3s'
                          }
                    }
                  >
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
                  </div>
                </div>
              }
              extraContent={
                currentInfo() !== 'top-wallets' || isMobile ? undefined : (
                  <Wallets
                    small
                    wallets={arrangedWallets.slice(-(arrangedWallets.length - 4))}
                    onClickWallet={handleClickWallet}
                    onClickOther={handleClickOther}
                  />
                )
              }
              onClickShowMore={handleClickShowMoreContent}
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
                  bigIcon
                  icon={
                    <svg
                      fill="currentColor"
                      stroke-width="0"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      height="1em"
                      width="1em"
                      style="overflow: visible;"
                      color="#494949"
                    >
                      <path
                        d="M85.57 446.25h340.86a32 32 0 0 0 28.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0 0 28.17 47.17Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="32px"
                      ></path>
                      <path
                        d="m250.26 195.39 5.74 122 5.73-121.95a5.74 5.74 0 0 0-5.79-6h0a5.74 5.74 0 0 0-5.68 5.95Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="32px"
                      ></path>
                      <path d="M256 397.25a20 20 0 1 1 20-20 20 20 0 0 1-20 20Z"></path>
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
