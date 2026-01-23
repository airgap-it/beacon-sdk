import { useEffect, useMemo, useState } from 'react'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import { arrangeTopWallets, mergeWallets, parseWallets } from '../../../utils/wallets'
import { Extension, NetworkType, ExtensionApp, DesktopApp, App, WebApp } from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import { fetchWalletListsFromGitHub } from '../../../utils/walletListFetcher'
import bundledTezosRegistry from '../../../data/tezos.json'
import bundledSubstrateRegistry from '../../../data/substrate.json'

type Blockchain = 'tezos' | 'substrate'

const BUNDLED_REGISTRIES = {
  tezos: bundledTezosRegistry,
  substrate: bundledSubstrateRegistry
}

const useWallets = (
  blockchain: Blockchain,
  networkType?: NetworkType,
  featuredWallets?: string[],
  skipGitHubFetch: boolean = false
) => {
  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>([])

  // Get bundled registry for this blockchain
  const bundledRegistry = BUNDLED_REGISTRIES[blockchain]

  // Log bundled version on mount
  useEffect(() => {
    console.log(
      `Loaded preshipped wallet list (version ${bundledRegistry.version}, updated ${bundledRegistry.updated})`
    )
  }, [blockchain])

  // Start with bundled wallet lists (instant display)
  const [desktopList, setDesktopList] = useState<DesktopApp[]>(bundledRegistry.desktopList as DesktopApp[])
  const [extensionList, setExtensionList] = useState<ExtensionApp[]>(bundledRegistry.extensionList as ExtensionApp[])
  const [iOSList, setIOSList] = useState<App[]>(bundledRegistry.iOSList as App[])
  const [webList, setWebList] = useState<WebApp[]>(bundledRegistry.webList as WebApp[])

  // Fetch wallet lists from GitHub in background (only if this blockchain is active)
  useEffect(() => {
    if (skipGitHubFetch) return

    const loadWalletLists = async () => {
      const githubRegistry = await fetchWalletListsFromGitHub(blockchain)

      if (githubRegistry) {
        // Hot-swap to GitHub data when available
        setDesktopList(githubRegistry.desktopList)
        setExtensionList(githubRegistry.extensionList)
        setIOSList(githubRegistry.iOSList)
        setWebList(githubRegistry.webList)
      }
    }

    loadWalletLists()
  }, [blockchain, skipGitHubFetch])

  // Fetch and listen for extension updates
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

  // Memoize wallet list creation
  const wallets = useMemo(() => {
    const merged = [
      // Desktop wallets filtered by available extensions
      ...desktopList
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
          deepLink: w.deepLink,
          deprecated: w.deprecated
        })),

      // Browser extensions
      ...extensionList.map((w) => ({
        id: w.id,
        key: w.key,
        name: w.shortName,
        image: w.logo,
        description: 'Browser Extension',
        supportedInteractionStandards: w.supportedInteractionStandards,
        type: 'extension' as const,
        link: w.link,
        deprecated: w.deprecated
      })),

      // iOS wallets
      ...iOSList.map((w) => ({
        id: w.key,
        key: w.key,
        name: w.shortName,
        image: w.logo,
        description: 'Mobile App',
        supportedInteractionStandards: w.supportedInteractionStandards,
        type: 'ios' as const,
        link: w.universalLink,
        deepLink: w.deepLink,
        deprecated: w.deprecated
      })),

      // Web wallets (networkType sensitive)
      ...webList.map((w) => {
        const link = w.links[networkType ?? NetworkType.MAINNET]
        return {
          id: w.key,
          key: w.key,
          name: w.shortName,
          image: w.logo,
          description: 'Web App',
          supportedInteractionStandards: w.supportedInteractionStandards,
          type: 'web' as const,
          link: link ?? w.links.mainnet,
          deprecated: w.deprecated
        }
      }),

      // Additional detected extensions
      ...availableExtensions
        .filter((e) => !extensionList.some((w) => w.id === e.id))
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

    const mergedWallets = mergeWallets(parseWallets(merged))

    // Filter out deprecated wallets based on type
    const filteredWallets = mergedWallets.filter((wallet) => {
      if (!wallet.deprecated) {
        return true // Keep all non-deprecated wallets
      }

      // For deprecated extension wallets, only keep if actually installed
      // (extensions can be auto-detected)
      if (wallet.types.includes('extension')) {
        return availableExtensions.some((ext) => ext.id === wallet.id || ext.id === wallet.firefoxId)
      }

      // For deprecated desktop/iOS/web wallets, keep them in the list
      // (they cannot be auto-detected, so we show them with deprecation message)
      return true
    })

    return arrangeTopWallets(
      filteredWallets,
      featuredWallets ?? ['kukai', 'temple', 'plenty', 'umami']
    )
  }, [desktopList, extensionList, iOSList, webList, availableExtensions, networkType, featuredWallets])

  // Memoize the final Map structure
  const walletsMap = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets])

  return { wallets: walletsMap, availableExtensions }
}

export default useWallets
