import { Logger, windowRef } from '@airgap/beacon-core'
import { StorageKey, ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-types'
import { useState } from 'react'
import { getTzip10Link } from '../../../utils/get-tzip10-link'
import { isTwBrowser, isAndroid, isMobileOS, isIOS } from '../../../utils/platform'
import { MergedWallet, OSLink } from '../../../utils/wallets'
import getDefaultLogo from '../getDefautlLogo'
import { parseUri } from '@walletconnect/utils'
import { AlertConfig, AlertState } from '../../common'

const logger = new Logger('useConnect')

const useConnect = (
  isMobile: boolean,
  wcPayload: Promise<string>,
  p2pPayload: Promise<string>,
  postPayload: Promise<string>,
  wallets: Map<string, MergedWallet>,
  onCloseHandler: Function
) => {
  const [wallet, setWallet] = useState<MergedWallet>()
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQRCode] = useState<string>()
  const [state, setState] = useState<AlertState>(AlertState.TOP_WALLETS)
  const [displayQRExtra, setDisplayQRExtra] = useState(false)
  const [showMoreContent, setShowMoreContent] = useState(false)
  const [isWCWorking, setIsWCWorking] = useState(true)

  const setInstallState = (wallet?: MergedWallet) => {
    if (
      !wallet ||
      (wallet.types.length <= 1 &&
        !wallet.types.includes('ios') &&
        !wallet.types.includes('desktop')) ||
      (isMobileOS(window) && wallet.types.length === 1 && wallet.types.includes('desktop'))
    ) {
      return
    }

    setState(AlertState.INSTALL)
  }

  const handleClickWallet = async (id: string, config: AlertConfig) => {
    setIsLoading(true)
    setShowMoreContent(false)
    const selectedWallet = wallets.get(id)
    setWallet(selectedWallet)

    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: selectedWallet?.key,
        type: 'mobile',
        icon: selectedWallet?.image
      })
    )

    if (selectedWallet?.types.includes('web') && selectedWallet?.types.length === 1) {
      handleNewTab(config, selectedWallet)
      return
    }

    if (
      selectedWallet &&
      selectedWallet.supportedInteractionStandards?.includes('wallet_connect')
    ) {
      const isValid = !!parseUri(await wcPayload).symKey
      setIsWCWorking(isValid)

      if (!isValid && selectedWallet?.name.toLowerCase().includes('kukai')) {
        setQRCode('error')
        setInstallState(selectedWallet)
        setIsLoading(false)
        return
      }

      if (isValid) {
        if (isMobile && selectedWallet.types.includes('ios') && selectedWallet.types.length === 1) {
          handleDeepLinking(selectedWallet)
        } else {
          setQRCode(await wcPayload)
          setInstallState(selectedWallet)
        }
      }
      setIsLoading(false)
    } else if (isMobileOS(window) && selectedWallet?.types.includes('ios') && isMobile) {
      setQRCode('')

      if (config.pairingPayload) {
        const link = getTzip10Link(
          isIOS(window) && selectedWallet.deepLink
            ? selectedWallet.deepLink
            : isAndroid(window)
              ? selectedWallet.links[OSLink.IOS]
              : 'tezos://',
          await p2pPayload
        )

        updateSelectedWalletWithURL(link)

        if (isAndroid(window)) {
          window.open(link, '_blank', 'noopener')
        } else {
          const a = document.createElement('a')
          a.setAttribute('href', link)
          a.setAttribute('rel', 'noopener')
          a.dispatchEvent(
            new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
          )
        }

        setIsLoading(false)
      }
    } else {
      setInstallState(selectedWallet)
      config.pairingPayload && setQRCode(await p2pPayload)
      setIsLoading(false)
    }
  }

  const updateSelectedWalletWithURL = (url: string) => {
    let wallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET) ?? '{}')

    if (!wallet.key) {
      return
    }

    wallet = {
      ...wallet,
      url
    }

    localStorage.setItem(StorageKey.LAST_SELECTED_WALLET, JSON.stringify(wallet))
  }

  const handleNewTab = async (config: AlertConfig, wallet: MergedWallet) => {
    if (!config.pairingPayload) {
      return
    }

    setIsLoading(true)
    // Noopener feature parameter cannot be used, because Chrome will open
    // about:blank#blocked instead and it will no longer work.
    const newTab = window.open('', '_blank')

    if (newTab) {
      newTab.opener = null
    }

    let link = ''

    if (
      wallet.supportedInteractionStandards?.includes('wallet_connect') &&
      !wallet.name.toLowerCase().includes('kukai')
    ) {
      const isValid = !!parseUri(await wcPayload).symKey
      setIsWCWorking(isValid)

      if (!isValid) {
        return
      }

      link = `${wallet.links[OSLink.WEB]}/wc?uri=${encodeURIComponent(await wcPayload)}`
    } else {
      link = getTzip10Link(wallet.links[OSLink.WEB], await p2pPayload)
    }

    if (newTab) {
      newTab.location.href = link
    } else {
      window.open(link, '_blank', 'noopener')
    }

    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet.key,
        name: wallet.name,
        type: 'web',
        icon: wallet?.image
      })
    )
  }

  const handleDeepLinking = async (wallet: MergedWallet) => {
    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        type: 'mobile',
        icon: wallet?.image
      })
    )

    const syncCode = await (wallet?.supportedInteractionStandards?.includes('wallet_connect')
      ? wcPayload
      : p2pPayload)

    if (!wallet?.links[OSLink.IOS]?.length) {
      if (!syncCode.length) {
        onCloseHandler()
        return
      }

      setQRCode(syncCode)
      setState(AlertState.QR)
      setDisplayQRExtra(true)

      return
    }

    let link = getTzip10Link(wallet.links[OSLink.IOS], syncCode)

    if (wallet?.supportedInteractionStandards?.includes('wallet_connect')) {
      link = `${wallet.links[OSLink.IOS]}wc?uri=${encodeURIComponent(syncCode)}`
    }

    updateSelectedWalletWithURL(link)
    logger.log('DO DEEPLINK WITH ' + link)

    if (isTwBrowser(window) && isAndroid(window)) {
      window.location.href = `${syncCode}`
    }
    if (isAndroid(window)) {
      window.open(link, '_blank', 'noopener')
    } else {
      const a = document.createElement('a')
      a.setAttribute('href', link)
      a.setAttribute('rel', 'noopener')
      a.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }))
    }
  }

  const handleClickOther = () => {
    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: 'wallet',
        name: 'wallet',
        type: 'mobile',
        icon: getDefaultLogo()
      })
    )
    setState(AlertState.QR)
  }

  const handleClickConnectExtension = async () => {
    setShowMoreContent(false)
    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: await postPayload,
      targetId: wallet?.id
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef.postMessage(message as any, windowRef.location.origin)

    if (wallet?.firefoxId) {
      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: await postPayload,
        targetId: wallet?.firefoxId
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      windowRef.postMessage(message as any, windowRef.location.origin)
    }

    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        name: wallet?.name,
        type: 'extension',
        icon: wallet?.image
      })
    )
  }

  const handleClickInstallExtension = () => {
    setShowMoreContent(false)
    window.open(wallet?.links[OSLink.EXTENSION] || '', '_blank', 'noopener')
  }

  const handleClickOpenDesktopApp = async () => {
    setShowMoreContent(false)

    if (p2pPayload) {
      const link = getTzip10Link(wallet?.deepLink || '', await p2pPayload)
      window.open(link, '_blank', 'noopener')
    }

    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        name: wallet?.name,
        type: 'desktop',
        icon: wallet?.image
      })
    )
  }

  const handleClickDownloadDesktopApp = () => {
    setShowMoreContent(false)
    window.open(wallet?.links[OSLink.DESKTOP] || '', '_blank', 'noopener')
  }

  const handleUpdateState = (newState: AlertState) => setState(newState)

  const handleUpdateQRCode = (uri: string) => setQRCode(uri)

  const handleShowMoreContent = () => setShowMoreContent((prev) => !prev)

  const handleDisplayQRExtra = (show: boolean) => setDisplayQRExtra(show)

  const handleIsLoading = (isLoading: boolean) => setIsLoading(isLoading)

  return [
    wallet,
    isLoading,
    qrCode,
    state,
    displayQRExtra,
    showMoreContent,
    isWCWorking,
    handleClickWallet,
    handleNewTab,
    handleDeepLinking,
    handleClickOther,
    handleClickConnectExtension,
    handleClickInstallExtension,
    handleClickOpenDesktopApp,
    handleClickDownloadDesktopApp,
    handleUpdateState,
    handleUpdateQRCode,
    handleShowMoreContent,
    handleDisplayQRExtra,
    handleIsLoading
  ] as const
}

export default useConnect
