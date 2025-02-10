import { Logger, windowRef } from '@airgap/beacon-core'
import { StorageKey, ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-types'
import { useState } from 'react'
import { getTzip10Link } from '../../../utils/get-tzip10-link'
import { isTwBrowser, isAndroid, isMobileOS, isIOS } from '../../../utils/platform'
import { MergedWallet, OSLink } from '../../../utils/wallets'
import getDefaultLogo from '../getDefautlLogo'
import { parseUri } from '@walletconnect/utils'
import { AlertConfig } from '../../common'

const logger = new Logger('useConnect')

const useConnect = (
  isMobile: boolean,
  wcPayload: string,
  p2pPayload: string,
  postPayload: string,
  wallets: Map<string, MergedWallet>,
  onCloseHandler: Function
) => {
  const [wallet, setWallet] = useState<MergedWallet>()
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQRCode] = useState<string>()
  const [state, setState] = useState<'top-wallets' | 'wallets' | 'install' | 'help' | 'qr'>(
    'top-wallets'
  )
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

    setState('install')
  }

  const handleClickWallet = (id: string, config: AlertConfig) => {
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

    if (
      (selectedWallet?.types.includes('web') && selectedWallet?.types.length === 1) ||
      (isAndroid(window) && selectedWallet?.name.toLowerCase().includes('kukai'))
    ) {
      handleNewTab(config, selectedWallet)
      return
    }

    if (
      selectedWallet &&
      selectedWallet.supportedInteractionStandards?.includes('wallet_connect')
    ) {
      const isValid = !!parseUri(wcPayload).symKey
      setIsWCWorking(isValid)

      if (!isValid && selectedWallet?.name.toLowerCase().includes('kukai')) {
        setQRCode('error')
        setInstallState(selectedWallet)
        setIsLoading(false)
        return
      }

      if (isValid) {
        if (isMobile && selectedWallet.types.includes('ios') && selectedWallet.types.length === 1) {
          handleDeepLinking(selectedWallet, wcPayload)
        } else {
          setQRCode(wcPayload)
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
          p2pPayload
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
      setIsLoading(false)
      setInstallState(selectedWallet)
      config.pairingPayload && setQRCode(p2pPayload)
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

  const handleNewTab = async (config: AlertConfig, wallet?: MergedWallet) => {
    if (!wallet) {
      return
    }

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
      const isValid = !!parseUri(wcPayload).symKey
      setIsWCWorking(isValid)

      if (!isValid) {
        return
      }

      link = `${wallet.links[OSLink.WEB]}/wc?uri=${encodeURIComponent(wcPayload)}`
    } else {
      link = getTzip10Link(wallet.links[OSLink.WEB], p2pPayload)
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
  
  const handleDeepLinking = (wallet: MergedWallet, uri: string) => {
    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        type: 'mobile',
        icon: wallet?.image
      })
    )

    if (!wallet?.links[OSLink.IOS]?.length) {
      const syncCode = wallet?.supportedInteractionStandards?.includes('wallet_connect')
        ? wcPayload
        : p2pPayload

      if (!syncCode.length) {
        onCloseHandler()
        return
      }

      setQRCode(syncCode)
      setState('qr')
      setDisplayQRExtra(true)

      return
    }

    const link = `${wallet.links[OSLink.IOS]}wc?uri=${encodeURIComponent(uri)}`
    updateSelectedWalletWithURL(`${wallet.links[OSLink.IOS]}wc?uri=`)
    logger.log('DO DEEPLINK WITH ' + link)

    if (isTwBrowser(window) && isAndroid(window)) {
      window.location.href = `${uri}`
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
    setState('qr')
  }

  const handleClickConnectExtension = () => {
    setShowMoreContent(false)
    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: postPayload,
      targetId: wallet?.id
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef.postMessage(message as any, windowRef.location.origin)

    if (wallet?.firefoxId) {
      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: postPayload,
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

  const handleClickOpenDesktopApp = () => {
    setShowMoreContent(false)

    if (p2pPayload) {
      const link = getTzip10Link(wallet?.deepLink || '', p2pPayload)
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

  const handleUpdateState = (newState: 'top-wallets' | 'wallets' | 'install' | 'help' | 'qr') =>
    setState(newState)

  const handleUpdateQRCode = (uri: string) => setQRCode(uri)

  const handleShowMoreContent = () => setShowMoreContent((prev) => !prev)

  const handleDisplayQRExtra = (show: boolean) => setDisplayQRExtra(show)

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
    handleDisplayQRExtra
  ] as const
}

export default useConnect
