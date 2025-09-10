import { useEffect, useMemo, useState } from 'react'
import { arrangeTopWallets, mergeWallets, parseWallets } from '../../../utils/wallets'
import { NetworkType, WalletLists } from '@airgap/beacon-types'
import { getSubstrateWalletLists } from '../../../utils/wallet-list-loader'

const useSubstrateWallets = (networkType?: NetworkType, featuredWallets?: string[]) => {
  const [walletLists, setWalletLists] = useState<WalletLists | null>(null)
  
  useEffect(() => {
    getSubstrateWalletLists().then(setWalletLists)
  }, [])
  
  const rawWallets = useMemo(() => {
    if (!walletLists) return []
    
    const desktops = walletLists.desktopList.map((w) => ({
      id: w.key,
      key: w.key,
      name: w.shortName,
      image: w.logo,
      description: 'Desktop App',
      supportedInteractionStandards: w.supportedInteractionStandards,
      type: 'desktop' as const,
      link: w.downloadLink,
      deepLink: w.deepLink
    }))

    const extensions = walletLists.extensionList.map((w) => ({
      id: w.id,
      key: w.key,
      name: w.shortName,
      image: w.logo,
      description: 'Browser Extension',
      supportedInteractionStandards: w.supportedInteractionStandards,
      type: 'extension' as const,
      link: w.link
    }))

    const ios = walletLists.iOSList.map((w) => ({
      id: w.key,
      key: w.key,
      name: w.shortName,
      image: w.logo,
      description: 'Mobile App',
      supportedInteractionStandards: w.supportedInteractionStandards,
      type: 'ios' as const,
      link: w.universalLink,
      deepLink: w.deepLink
    }))

    const web = walletLists.webList.map((w) => {
      const link = w.links[networkType ?? NetworkType.MAINNET] ?? w.links.mainnet
      return {
        id: w.key,
        key: w.key,
        name: w.shortName,
        image: w.logo,
        description: 'Web App',
        supportedInteractionStandards: w.supportedInteractionStandards,
        type: 'web' as const,
        link
      }
    })

    return [...desktops, ...extensions, ...ios, ...web]
  }, [networkType, walletLists])

  const wallets = useMemo(() => {
    const parsed = parseWallets(rawWallets)
    const merged = mergeWallets(parsed)
    const arranged = arrangeTopWallets(
      merged,
      featuredWallets ?? ['acurast-lite', 'airgap_ios', 'nova_ios', 'fearless_ios']
    )

    if (!featuredWallets || featuredWallets.length > 1) {
      return arranged
    }

    // `filter` instead of `find` for convinient return type
    const result = arranged.filter((el) => el.id === featuredWallets[0])

    return result.length > 0 ? result : arranged
  }, [rawWallets, featuredWallets])

  return useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets])
}

export default useSubstrateWallets
