/**
 * WalletStorage - Chrome Storage Wrapper for Wallet State
 *
 * Handles persistence of wallet credentials (mnemonic/private key)
 * and preferences using Chrome's storage API.
 *
 * NOTE: In a production wallet, you should encrypt sensitive data
 * before storing it. This example stores data in plain text for simplicity.
 */

const STORAGE_KEYS = {
  MNEMONIC: 'wallet_mnemonic',
  PRIVATE_KEY: 'wallet_private_key',
  PREFERRED_NETWORK: 'wallet_preferred_network'
} as const

export interface StoredWalletData {
  mnemonic?: string
  privateKey?: string
  preferredNetwork?: string
}

export async function saveMnemonic(mnemonic: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.MNEMONIC]: mnemonic,
    [STORAGE_KEYS.PRIVATE_KEY]: null // Clear private key if saving mnemonic
  })
}

export async function savePrivateKey(privateKey: string): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.PRIVATE_KEY]: privateKey,
    [STORAGE_KEYS.MNEMONIC]: null // Clear mnemonic if saving private key
  })
}

export async function getStoredWallet(): Promise<StoredWalletData> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.MNEMONIC, STORAGE_KEYS.PRIVATE_KEY, STORAGE_KEYS.PREFERRED_NETWORK])

  return {
    mnemonic: result[STORAGE_KEYS.MNEMONIC] || undefined,
    privateKey: result[STORAGE_KEYS.PRIVATE_KEY] || undefined,
    preferredNetwork: result[STORAGE_KEYS.PREFERRED_NETWORK] || undefined
  }
}

export async function hasStoredWallet(): Promise<boolean> {
  const { mnemonic, privateKey } = await getStoredWallet()
  return Boolean(mnemonic || privateKey)
}

export async function clearWallet(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEYS.MNEMONIC, STORAGE_KEYS.PRIVATE_KEY])
}

export async function savePreferredNetwork(network: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_NETWORK]: network })
}

export async function getPreferredNetwork(): Promise<string | undefined> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERRED_NETWORK)
  return result[STORAGE_KEYS.PREFERRED_NETWORK]
}
