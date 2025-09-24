import { WalletLists } from '@airgap/beacon-types'

const WALLET_LISTS_BASE_URL = 
  (typeof process !== 'undefined' && process.env?.BEACON_WALLET_LISTS_URL) ||
  'https://raw.githubusercontent.com/airgap-it/beacon-sdk/feat/remote-wallet-list/wallet-lists/'

const walletListCache: Record<string, WalletLists> = {}

export async function loadWalletLists(blockchain: string): Promise<WalletLists> {
  if (walletListCache[blockchain]) {
    return walletListCache[blockchain]
  }

  try {
    const response = await fetch(`${WALLET_LISTS_BASE_URL}${blockchain}.json`)
    if (response.ok) {
      const data = await response.json()
      walletListCache[blockchain] = data
      return data
    }
  } catch (error) {
    console.warn(`Failed to fetch remote wallet lists for ${blockchain}:`, error)
  }

  // Use bundled wallet lists as fallback with dynamic import
  try {
    const bundledData = await import(`../../../../wallet-lists/${blockchain}.json`)
    const walletList = bundledData.default || bundledData
    console.log(`Using bundled wallet list for ${blockchain}`)
    walletListCache[blockchain] = walletList
    return walletList
  } catch (importError) {
    console.error(`Failed to load bundled wallet list for ${blockchain}:`, importError)
    const emptyLists: WalletLists = {
      version: 1,
      extensionList: [],
      desktopList: [],
      webList: [],
      iOSList: []
    }
    walletListCache[blockchain] = emptyLists
    return emptyLists
  }
}

export async function getDefaultWalletLists(): Promise<WalletLists> {
  return loadWalletLists('tezos')
}

export async function getSubstrateWalletLists(): Promise<WalletLists> {
  return loadWalletLists('substrate')
}