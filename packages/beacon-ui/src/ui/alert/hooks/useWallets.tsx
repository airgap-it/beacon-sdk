import { useCallback, useEffect, useState } from 'react'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import {
  arrangeTopWallets,
  MergedWallet,
  mergeWallets,
  parseWallets,
  Wallet
} from 'src/utils/wallets'
import { Extension, NetworkType } from '@airgap/beacon-types'
import { desktopList, extensionList, iOSList, webList } from '../wallet-lists'
import { windowRef } from '@airgap/beacon-core'

const useWallets = (networkType?: NetworkType, featuredWallets?: string[]) => {
  const [wallets, setWallets] = useState<MergedWallet[]>([])

  useEffect(() => {
    PostMessageTransport.getAvailableExtensions().then((extensions) =>
      setWallets(createWallets(extensions))
    )
    const handler = async (event: any): Promise<void> => {
      if (event.data === 'extensionsUpdated') {
        setWallets(createWallets(await PostMessageTransport.getAvailableExtensions()))
      }
    }
    windowRef.addEventListener('message', handler)
    return () => {
      windowRef.removeEventListener('message', handler)
    }
  }, [])

  const createWallets = useCallback((availableExtensions: Extension[]) => {
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
            supportedInteractionStandards: wallet.supportedInteractionStandards,
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
          supportedInteractionStandards: wallet.supportedInteractionStandards,
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
        const link = wallet.links[networkType ?? NetworkType.MAINNET]
        return {
          id: wallet.key,
          key: wallet.key,
          name: wallet.shortName,
          image: wallet.logo,
          description: 'Web App',
          supportedInteractionStandards: wallet.supportedInteractionStandards,
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

    // Sort wallets by top 4
    const arrangedWallets = arrangeTopWallets(mergedWallets, featuredWallets ?? defaultWalletList)

    return arrangedWallets
  }, [])

  return new Map(wallets.map((wallet) => [wallet.id, wallet]))
}
export default useWallets
