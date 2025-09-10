import { WalletLists } from '@airgap/beacon-types'
import { WALLET_LISTS_BASE_URL } from '../constants'

function validateWalletLists(data: any): data is WalletLists {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (typeof data.version !== 'number') {
    console.warn('Invalid wallet list: missing or invalid version field')
    return false
  }

  const requiredArrays = ['extensionList', 'desktopList', 'webList', 'iOSList']
  for (const field of requiredArrays) {
    if (!Array.isArray(data[field])) {
      console.warn(`Invalid wallet list: ${field} is not an array`)
      return false
    }
  }

  const allEntries = [
    ...data.extensionList,
    ...data.desktopList,
    ...data.webList,
    ...data.iOSList
  ]

  for (const entry of allEntries) {
    if (!entry.name || !entry.key) {
      console.warn('Invalid wallet entry: missing name or key', entry)
      return false
    }
    if (entry.logo && typeof entry.logo === 'string') {
      if (!entry.logo.startsWith('data:image/')) {
        console.warn('Invalid wallet entry: logo is not a data URI', entry.key)
        return false
      }
    }
  }

  return true
}

/**
 * Creates a fetch request with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if ((error as any).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

export async function fetchRemoteWalletLists(
  blockchain: string
): Promise<WalletLists> {
  try {
    const response = await fetchWithTimeout(`${WALLET_LISTS_BASE_URL}${blockchain}.json`)
    
    if (!response.ok) {
      console.warn(`Failed to fetch remote wallet list for ${blockchain}: HTTP ${response.status}`)
      throw new Error(`HTTP ${response.status}`)
    }

    const remoteData = await response.json()
    
    if (!validateWalletLists(remoteData)) {
      console.warn(`Invalid remote wallet list structure for ${blockchain}`)
      throw new Error('Invalid structure')
    }

    if (remoteData.version > 1) {
      console.warn(`Remote wallet list version ${remoteData.version} may not be compatible`)
      throw new Error('Incompatible version')
    }

    return remoteData
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.warn(`Timeout fetching remote wallet list for ${blockchain}, using bundled JSON`)
      } else if (error.message.includes('fetch')) {
        console.warn(`Network error fetching remote wallet list for ${blockchain}, using bundled JSON`)
      } else {
        console.warn(`Error fetching remote wallet list for ${blockchain}, using bundled JSON:`, error.message)
      }
    } else {
      console.warn(`Unknown error fetching remote wallet list for ${blockchain}, using bundled JSON:`, error)
    }
    
    // Fall back to bundled JSON using dynamic import
    try {
      const bundledData = await import(`../../../../wallet-lists/${blockchain}.json`)
      const walletList = bundledData.default || bundledData
      if (validateWalletLists(walletList)) {
        console.log(`Using bundled wallet list for ${blockchain}`)
        return walletList
      }
      throw new Error('Invalid bundled wallet list')
    } catch (importError) {
      console.error(`Failed to load bundled wallet list for ${blockchain}:`, importError)
      // Return a minimal valid structure as last resort
      return {
        version: 1,
        extensionList: [],
        desktopList: [],
        webList: [],
        iOSList: []
      }
    }
  }
}