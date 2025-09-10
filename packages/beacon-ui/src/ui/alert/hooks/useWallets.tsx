import { useEffect, useMemo, useState } from 'react'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import { arrangeTopWallets, mergeWallets, parseWallets } from '../../../utils/wallets'
import { Extension, NetworkType, WalletLists } from '@airgap/beacon-types'
import { getDefaultWalletLists } from '../../../utils/wallet-list-loader'
import { windowRef } from '@airgap/beacon-core'

const useWallets = (networkType?: NetworkType, featuredWallets?: string[]) => {
  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>([])
  const [walletLists, setWalletLists] = useState<WalletLists | null>(null)

  useEffect(() => {
    getDefaultWalletLists().then(setWalletLists)
  }, [])

  useEffect(() => {
    PostMessageTransport.getAvailableExtensions().then(setAvailableExtensions)

    const handler = async (event: any) => {
      if (event.data === 'extensionsUpdated') {
        const extensions = await PostMessageTransport.getAvailableExtensions()
        setAvailableExtensions(extensions)
      }
    }

    windowRef.addEventListener('message', handler)
    return () => windowRef.removeEventListener('message', handler)
  }, [])

  const wallets = useMemo(() => {
    if (!walletLists) return []
    
    const merged = [
      ...walletLists.desktopList
        .filter((w) => !availableExtensions.some((e) => w.name === e.name))
        .map((w) => ({
          id: w.key,
          key: w.key,
          name: w.shortName,
          image: w.logo,
          description: 'Desktop App',
          supportedInteractionStandards: w.supportedInteractionStandards,
          type: 'desktop' as const,
          link: w.downloadLink,
          deepLink: w.deepLink
        })),
      ...walletLists.extensionList.map((w) => ({
        id: w.id,
        key: w.key,
        name: w.shortName,
        image: w.logo,
        description: 'Browser Extension',
        supportedInteractionStandards: w.supportedInteractionStandards,
        type: 'extension' as const,
        link: w.link
      })),
      ...walletLists.iOSList.map((w) => ({
        id: w.key,
        key: w.key,
        name: w.shortName,
        image: w.logo,
        description: 'Mobile App',
        supportedInteractionStandards: w.supportedInteractionStandards,
        type: 'ios' as const,
        link: w.universalLink,
        deepLink: w.deepLink
      })),
      ...walletLists.webList.map((w) => {
        const link = w.links[networkType ?? NetworkType.MAINNET]
        return {
          id: w.key,
          key: w.key,
          name: w.shortName,
          image: w.logo,
          description: 'Web App',
          supportedInteractionStandards: w.supportedInteractionStandards,
          type: 'web' as const,
          link: link ?? w.links.mainnet
        }
      }),
      ...availableExtensions
        .filter((e) => !walletLists.extensionList.some((w) => w.id === e.id))
        .map((e) => ({
          id: e.id,
          key: e.id,
          name: e.shortName ?? e.name ?? '',
          image: e.iconUrl ?? '',
          description: 'Browser Extension',
          type: 'extension' as const,
          link: (e as any).link ?? ''
        }))
    ]

    return arrangeTopWallets(
      mergeWallets(parseWallets(merged)),
      featuredWallets ?? ['kukai', 'temple', 'plenty', 'umami']
    )
  }, [availableExtensions, networkType, featuredWallets, walletLists])

  return useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets])
}

export default useWallets
