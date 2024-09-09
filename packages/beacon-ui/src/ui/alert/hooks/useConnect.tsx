import { Logger, windowRef } from '@airgap/beacon-core'
import { StorageKey, ExtensionMessage, ExtensionMessageTarget } from '@airgap/beacon-types'
import { useCallback, useState } from 'react'
import { getTzip10Link } from 'src/utils/get-tzip10-link'
import { isTwBrowser, isAndroid, isMobileOS, isIOS } from 'src/utils/platform'
import { MergedWallet, OSLink } from 'src/utils/wallets'
import { Serializer } from '@airgap/beacon-core'
import getDefaultLogo from '../getDefautlLogo'
import { parseUri } from '@walletconnect/utils'
import { AlertConfig } from '../common'
import useIsMobile from './useIsMobile'

const logger = new Logger('useConnect')

const useConnect = (
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
  const isMobile = isMobileOS(window) || useIsMobile()

  const handleClickWallet = async (id: string, config: AlertConfig) => {
    setIsLoading(true)
    setShowMoreContent(false)
    const wallet = wallets.get(id)
    setWallet(wallet)

    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        type: 'mobile',
        icon: wallet?.image
      })
    )

    if (
      (wallet?.types.includes('web') && wallet?.types.length === 1) ||
      (isAndroid(window) && wallet?.name.toLowerCase().includes('kukai'))
    ) {
      handleNewTab(config, wallet)
      return
    }

    if (wallet && wallet.supportedInteractionStandards?.includes('wallet_connect')) {
      const isValid = !!parseUri(wcPayload).symKey
      setIsWCWorking(isValid)

      if (!isValid && wallet?.name.toLowerCase().includes('kukai')) {
        setQRCode('error')
        // setInstallState(wallet)
        setIsLoading(false)
        return
      }

      if (isValid) {
        if (isMobile && wallet.types.includes('ios') && wallet.types.length === 1) {
          handleDeepLinking(wcPayload)
        } else {
          setQRCode(wcPayload)
          // setInstallState(wallet)
        }
      }
      setIsLoading(false)
    } else if (wallet?.types.includes('ios') && isMobile) {
      setQRCode('')

      if (config.pairingPayload) {
        const serializer = new Serializer()
        const code = await serializer.serialize(await p2pPayload)

        const link = getTzip10Link(
          isIOS(window) && wallet.deepLink
            ? wallet.deepLink
            : isAndroid(window)
            ? wallet.links[OSLink.IOS]
            : 'tezos://',
          code
        )

        updateSelectedWalletWithURL(link)

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
      setIsLoading(false)
      // setInstallState(wallet)
      // await setDefaultPayload()
    }
  }

  const updateSelectedWalletWithURL = useCallback((url: string) => {
    let wallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET) ?? '{}')

    if (!wallet.key) {
      return
    }

    wallet = {
      ...wallet,
      url
    }

    localStorage.setItem(StorageKey.LAST_SELECTED_WALLET, JSON.stringify(wallet))
  }, [])

  const handleNewTab = useCallback(async (config: AlertConfig, wallet?: MergedWallet) => {
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
      const serializer = new Serializer()
      const code = await serializer.serialize(p2pPayload)
      link = getTzip10Link(wallet.links[OSLink.WEB], code)
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
  }, [])

  const handleDeepLinking = useCallback(async (uri: string) => {
    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        type: 'mobile',
        icon: wallet?.image
      })
    )

    if (!wallet?.links[OSLink.IOS].length) {
      const syncCode = wallet?.supportedInteractionStandards?.includes('wallet_connect')
        ? wcPayload ?? ''
        : await new Serializer().serialize(p2pPayload)

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
  }, [])

  const handleClickOther = useCallback(() => {
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
  }, [])

  const handleClickConnectExtension = useCallback(async () => {
    setShowMoreContent(false)
    const serializer = new Serializer()
    const postmessageCode = await serializer.serialize(postPayload)

    const message: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: postmessageCode,
      targetId: wallet?.id
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef.postMessage(message as any, windowRef.location.origin)

    if (wallet?.firefoxId) {
      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: postmessageCode,
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
  }, [])

  const handleClickInstallExtension = useCallback(() => {
    setShowMoreContent(false)
    window.open(wallet?.links[OSLink.EXTENSION] || '', '_blank', 'noopener')
  }, [])

  const handleClickOpenDesktopApp = useCallback(async () => {
    setShowMoreContent(false)

    if (p2pPayload) {
      const serializer = new Serializer()
      const code = await serializer.serialize(p2pPayload)
      const link = getTzip10Link(wallet?.deepLink || '', code)
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
  }, [])

  const handleClickDownloadDesktopApp = useCallback(() => {
    setShowMoreContent(false)
    window.open(wallet?.links[OSLink.DESKTOP] || '', '_blank', 'noopener')
  }, [])

  const handleUpdateState = useCallback(
    (newState: 'top-wallets' | 'wallets' | 'install' | 'help' | 'qr') => setState(newState),
    []
  )

  const handleUpdateQRCode = useCallback((uri: string) => setQRCode(uri), [])

  return [
    wallet,
    isMobile,
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
    handleUpdateQRCode
  ] as const
}

export default useConnect
