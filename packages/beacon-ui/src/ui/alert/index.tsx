import { createSignal } from 'solid-js'
import {
  AnalyticsInterface,
  ExtensionMessage,
  ExtensionMessageTarget,
  NetworkType,
  P2PPairingRequest,
  PostMessagePairingRequest,
  StorageKey,
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
import * as loaderStyles from '../../components/loader/styles.css'
import * as pairOtherStyles from '../../components/pair-other/styles.css'

import { Serializer, windowRef } from '@airgap/beacon-core'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import {
  arrangeTopWallets,
  MergedWallet,
  mergeWallets,
  parseWallets,
  Wallet
} from 'src/utils/wallets'
import { getTzip10Link } from 'src/utils/get-tzip10-link'
import { isAndroid, isIOS, isTwBrowser } from 'src/utils/platform'
import { getColorMode } from 'src/utils/colorMode'
import PairOther from 'src/components/pair-other/pair-other'

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
    networkType: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
  analytics?: AnalyticsInterface
  featuredWallets?: string[]
}

// State variables
const [isOpen, setIsOpen] = createSignal<boolean>(false)
const [isLoading, setIsLoading] = createSignal<boolean>(false)
const [showMoreContent, setShowMoreContent] = createSignal<boolean>(false)
const [codeQR, setCodeQR] = createSignal<string>('')
const [walletList, setWalletList] = createSignal<MergedWallet[]>([])
const [currentWallet, setCurrentWallet] = createSignal<MergedWallet | undefined>(undefined)
const [previousInfo, setPreviousInfo] = createSignal<
  'top-wallets' | 'wallets' | 'install' | 'help' | 'qr'
>('top-wallets')
const [currentInfo, setCurrentInfo] = createSignal<
  'top-wallets' | 'wallets' | 'install' | 'help' | 'qr'
>('top-wallets')
const [analytics, setAnalytics] = createSignal<AnalyticsInterface | undefined>(undefined)

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
  const p2pPayload = config.pairingPayload?.p2pSyncCode()
  const wcPayload = config.pairingPayload?.walletConnectSyncCode()

  setAnalytics(config.analytics)

  // TODO: Remove eager connection
  p2pPayload?.then(() => {
    console.log('P2P LOADED')
  })
  wcPayload?.then(() => {
    console.log('WC LOADED')
  })

  if (isServer) {
    console.log('DO NOT RUN ON SERVER')
    return ''
  }

  if (!isOpen()) {
    let availableExtensions = await PostMessageTransport.getAvailableExtensions()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extensionsUpdatedFn = async (event: any): Promise<void> => {
      if (event.data === 'extensionsUpdated') {
        availableExtensions = await PostMessageTransport.getAvailableExtensions()
        setWalletList(createWalletList())
      }
    }

    windowRef.addEventListener('message', extensionsUpdatedFn)

    const setDefaultPayload = async () => {
      if (config.pairingPayload) {
        const serializer = new Serializer()
        const codeQR = await serializer.serialize(await p2pPayload)
        setCodeQR(codeQR)
      }
    }

    setCurrentInfo('top-wallets')
    setCurrentWallet(undefined)
    localStorage.removeItem(StorageKey.LAST_SELECTED_WALLET)

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

    // Loader styles
    const style7 = document.createElement('style')
    style7.textContent = loaderStyles.default
    shadowRoot.appendChild(style7)

    // PairOther styles
    const style8 = document.createElement('style')
    style8.textContent = pairOtherStyles.default
    shadowRoot.appendChild(style8)

    // Inject font styles
    const styleFonts = document.createElement('style')
    styleFonts.textContent =
      "* { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;}"
    shadowRoot.appendChild(styleFonts)

    const createWalletList = () => {
      const wallets: Wallet[] = [
        ...desktopList
          // This is used for a special case where desktop wallets have inApp browsers.
          // In this case, the wallet will act like an extension. This means we have to remove
          // the desktop app from the list to make the user experience better. One example of this
          // is Infinity Wallet.
          .filter(
            (wallet) => !availableExtensions.some((extWallet) => wallet.name === extWallet.name)
          )
          .map((wallet) => {
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
          const link = wallet.links[config.pairingPayload?.networkType ?? NetworkType.MAINNET]
          return {
            id: wallet.key,
            key: wallet.key,
            name: wallet.shortName,
            image: wallet.logo,
            description: 'Web App',
            type: 'web',
            link: link ?? wallet.links.mainnet
          }
        }),
        ...availableExtensions
          .filter((newExt) => !extensionList.some((ext) => ext.id === newExt.id))
          .map((wallet) => {
            return {
              id: wallet.id,
              key: wallet.id,
              name: wallet.shortName ?? wallet.name ?? '',
              image: wallet.iconUrl ?? '',
              description: 'Browser Extension',
              type: 'extension',
              link: (wallet as any).link ?? ''
            }
          })
      ]

      // Parse wallet names
      const parsedWallets = parseWallets(wallets)

      // Merge wallets by name
      const mergedWallets = mergeWallets(parsedWallets)

      // Default selection of featured wallets
      const defaultWalletList = ['kukai', 'temple', 'plenty', 'umami']

      // Sort wallets by top4
      const arrangedWallets = arrangeTopWallets(
        mergedWallets,
        config.featuredWallets ?? defaultWalletList
      )

      return arrangedWallets
    }

    setWalletList(createWalletList())

    const isMobile = window.innerWidth <= 800

    const handleClickShowMoreContent = () => {
      analytics()?.track('click', 'ui', 'show more wallets')
      setShowMoreContent(!showMoreContent())
    }

    const handleClickLearnMore = () => {
      analytics()?.track('click', 'ui', 'learn more')
      setPreviousInfo(currentInfo())
      setCurrentInfo('help')
      setShowMoreContent(false)
    }

    const handleClickQrCode = () => {
      analytics()?.track('click', 'ui', 'copy QR code to clipboard')
    }

    const handleCloseAlert = () => {
      closeAlert('')
      windowRef.removeEventListener('message', extensionsUpdatedFn)
      if (config.closeButtonCallback) config.closeButtonCallback()
    }

    const handleClickWallet = async (id: string) => {
      if (isLoading()) return

      setIsLoading(true)
      setShowMoreContent(false)
      const wallet = walletList().find((wallet) => wallet.id === id)
      setCurrentWallet(wallet)
      if (wallet?.key) {
        analytics()?.track('click', 'ui', 'opened wallet', { key: wallet.key })
        localStorage.setItem(StorageKey.LAST_SELECTED_WALLET, wallet.key)
      }

      if (wallet?.types.includes('web')) {
        if (p2pPayload) {
          // Noopener feature parameter cannot be used, because Chrome will open
          // about:blank#blocked instead and it will no longer work.
          const newTab = window.open('', '_blank')

          if (newTab) {
            newTab.opener = null
          }

          const serializer = new Serializer()
          const code = await serializer.serialize(await p2pPayload)
          const link = getTzip10Link(wallet.link, code)

          if (newTab) {
            newTab.location.href = link
          } else {
            window.open(link, '_blank', 'noopener')
          }
        }
        setIsLoading(false)
        return
      }

      if (wallet && wallet.supportedInteractionStandards?.includes('wallet_connect')) {
        const uri = (await wcPayload)?.uri

        if (uri) {
          if (isAndroid(window) || isIOS(window)) {
            let link = `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`

            if (isTwBrowser(window) && isAndroid(window)) {
              link = `${uri}`
              window.location.href = link
            } else if (isAndroid(window)) {
              window.open(link, '_blank', 'noopener')
            } else if (isIOS(window)) {
              const a = document.createElement('a')
              a.setAttribute('href', link)
              a.setAttribute('rel', 'noopener')
              a.dispatchEvent(
                new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
              )
            }
          } else {
            setCodeQR(uri)
            setCurrentInfo('install')
          }
        }
        setIsLoading(false)
      } else if (wallet?.types.includes('ios') && isMobile) {
        setCodeQR('')

        if (config.pairingPayload) {
          const serializer = new Serializer()
          const code = await serializer.serialize(await p2pPayload)

          const link = getTzip10Link(
            isIOS(window) && wallet.deepLink
              ? wallet.deepLink
              : isAndroid(window)
              ? 'tezos://'
              : wallet.link,
            code
          )

          if (isAndroid(window)) window.open(link, '_blank', 'noopener')
          else if (isIOS(window)) {
            const a = document.createElement('a')
            a.setAttribute('href', link)
            a.setAttribute('rel', 'noopener')
            a.dispatchEvent(
              new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
            )
          }
        }
        setIsLoading(false)
      } else {
        await setDefaultPayload()
        setIsLoading(false)
        setCurrentInfo('install')
      }
    }

    const handleClickOther = async () => {
      analytics()?.track('click', 'ui', 'other wallet')

      setCurrentInfo('qr')
    }

    const handleClickConnectExtension = async () => {
      analytics()?.track('click', 'ui', 'open extension', { key: currentWallet()?.key })

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

        if (currentWallet()?.firefoxId) {
          const message: ExtensionMessage<string> = {
            target: ExtensionMessageTarget.EXTENSION,
            payload: postmessageCode,
            targetId: currentWallet()?.firefoxId
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          windowRef.postMessage(message as any, windowRef.location.origin)
        }
      }
    }

    const handleClickInstallExtension = async () => {
      analytics()?.track('click', 'ui', 'install extension', { key: currentWallet()?.key })

      setShowMoreContent(false)
      window.open(currentWallet()?.link || '', '_blank', 'noopener')
    }

    const handleClickOpenDesktopApp = async () => {
      setShowMoreContent(false)
      analytics()?.track('click', 'ui', 'open desktop', { key: currentWallet()?.key })

      if (p2pPayload) {
        const serializer = new Serializer()
        const code = await serializer.serialize(await p2pPayload)
        const link = getTzip10Link(currentWallet()?.deepLink || '', code)
        window.open(link, '_blank', 'noopener')
      }
    }

    const handleClickDownloadDesktopApp = async () => {
      analytics()?.track('click', 'ui', 'download desktop', { key: currentWallet()?.key })

      setShowMoreContent(false)
      window.open(currentWallet()?.link || '', '_blank', 'noopener')
    }

    const hasExtension = () =>
      availableExtensions
        .map((extension) => extension.id)
        .includes(currentWallet()?.firefoxId || '') ||
      availableExtensions.map((extension) => extension.id).includes(currentWallet()?.id || '')

    const colorMode = getColorMode()

    dispose = render(
      () => (
        <div class={`theme__${colorMode}`}>
          {config.pairingPayload && (
            <Alert
              loading={isLoading()}
              open={isOpen()}
              showMore={showMoreContent()}
              content={
                <div>
                  {currentInfo() === 'install' && (
                    <div
                      style={
                        currentInfo() === 'install' || currentInfo() === 'qr'
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
                            walletName={currentWallet()?.name || 'AirGap'}
                            code={codeQR()}
                            onClickLearnMore={handleClickLearnMore}
                            onClickQrCode={handleClickQrCode}
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
                            walletName={currentWallet()?.name || 'AirGap'}
                            code={codeQR()}
                            onClickLearnMore={handleClickLearnMore}
                            onClickQrCode={handleClickQrCode}
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
                          walletName={currentWallet()?.name || 'AirGap'}
                          code={codeQR()}
                          onClickLearnMore={handleClickLearnMore}
                          onClickQrCode={handleClickQrCode}
                        />
                      )}
                    </div>
                  )}
                  {currentInfo() === 'qr' && (
                    <div
                      style={
                        currentInfo() === 'install' || currentInfo() === 'qr'
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
                      <PairOther
                        walletList={walletList()}
                        onClickLearnMore={handleClickLearnMore}
                        p2pPayload={p2pPayload}
                        wcPayload={wcPayload}
                      ></PairOther>
                    </div>
                  )}
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
                      disabled={isLoading()}
                      wallets={walletList().slice(-(walletList().length - (isMobile ? 3 : 4)))}
                      isMobile={isMobile}
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
                      currentInfo() !== 'qr' &&
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
                      disabled={isLoading()}
                      wallets={isMobile ? walletList().slice(0, 3) : walletList().slice(0, 4)}
                      onClickWallet={handleClickWallet}
                      onClickLearnMore={handleClickLearnMore}
                      otherWallets={
                        isMobile
                          ? {
                              images: [
                                walletList()[3].image,
                                walletList()[4].image,
                                walletList()[5].image
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
                    disabled={isLoading()}
                    small
                    wallets={walletList().slice(-(walletList().length - 4))}
                    isMobile={isMobile}
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
                  : currentInfo() === 'qr'
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
                  data={config.data}
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
        </div>
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
