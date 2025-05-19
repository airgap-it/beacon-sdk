import { useEffect, useMemo, useState } from 'react'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import { arrangeTopWallets, mergeWallets, parseWallets } from '../../../utils/wallets'
import { Extension, NetworkType } from '@airgap/beacon-types'
import { desktopList, extensionList, iOSList, webList } from '../wallet-lists'
import { windowRef } from '@airgap/beacon-core'

const useWallets = (networkType?: NetworkType, featuredWallets?: string[]) => {
  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>([])

  useEffect(() => {
    PostMessageTransport.getAvailableExtensions().then(setAvailableExtensions)

    const handler = async (event: any) => {
      if (event.data === 'extensionsUpdated') {
        const exts = await PostMessageTransport.getAvailableExtensions()
        setAvailableExtensions(exts)
      }
    }

    windowRef.addEventListener('message', handler)
    return () => windowRef.removeEventListener('message', handler)
  }, [])

  const rawWallets = useMemo(() => {
    const desktops = desktopList
      .filter((w) => !availableExtensions.some((e) => e.name === w.name))
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
      }))

    const extensions = extensionList.map((w) => ({
      id: w.id,
      key: w.key,
      name: w.shortName,
      image: w.logo,
      description: 'Browser Extension',
      supportedInteractionStandards: w.supportedInteractionStandards,
      type: 'extension' as const,
      link: w.link
    }))

    const ios = iOSList.map((w) => ({
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

    const web = webList.map((w) => {
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

    const extras = availableExtensions
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

    return [...desktops, ...extensions, ...ios, ...web, ...extras]
  }, [availableExtensions, networkType])

  const wallets = useMemo(() => {
    const parsed = parseWallets(rawWallets)
    const merged = mergeWallets(parsed)
    const arranged = arrangeTopWallets(merged, featuredWallets ?? ['acurast'])
    return arranged
  }, [rawWallets, featuredWallets])

  return useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets])
}

export default useWallets
