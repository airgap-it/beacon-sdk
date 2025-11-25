/**
 * WalletProvider Interface
 *
 * This interface defines the contract between the Beacon protocol layer
 * and your wallet's signing implementation.
 *
 * TO USE THIS EXTENSION AS A BLUEPRINT:
 * 1. Create a class that implements this interface
 * 2. Replace TaquitoProvider with your implementation
 * 3. Wire it up in background/index.ts
 *
 * The Beacon layer will call these methods when it needs wallet functionality,
 * completely abstracting away protocol details from your signing code.
 */

import type { NetworkConfig, TezosOperation } from '../beacon/types'

export interface WalletInfo {
  address: string
  publicKey: string
}

export interface SignPayloadResult {
  signature: string
}

export interface SignOperationResult {
  opHash: string
}

/**
 * Interface for wallet signing functionality.
 *
 * Implement this interface to plug in your own wallet's signing logic.
 * The Beacon protocol layer will use these methods to:
 * - Check if the wallet is ready to sign
 * - Get wallet address/public key for permission responses
 * - Sign payloads (raw bytes, operations, micheline)
 * - Sign and broadcast operations to the network
 */
export interface WalletProvider {
  /**
   * Check if the wallet is initialized and ready to sign.
   * Called before processing any signing request.
   */
  isReady(): boolean

  /**
   * Get the wallet's address and public key.
   * Used for permission responses and display in the UI.
   *
   * @returns Wallet info or null if not initialized
   */
  getWalletInfo(): WalletInfo | null

  /**
   * Sign a payload.
   *
   * @param payload - The hex-encoded payload to sign (may or may not start with 0x)
   * @param signingType - The type of signing: 'raw', 'operation', or 'micheline'
   * @returns The signature in the appropriate format (e.g., edsig... for ed25519)
   */
  signPayload(payload: string, signingType: 'raw' | 'operation' | 'micheline'): Promise<SignPayloadResult>

  /**
   * Sign and broadcast an operation to the network.
   *
   * @param operations - Array of Tezos operations to sign and broadcast
   * @param network - Network configuration including RPC URL
   * @returns The operation hash after successful broadcast
   */
  signOperation(operations: TezosOperation[], network: NetworkConfig): Promise<SignOperationResult>
}

/**
 * Extended interface for wallets that support mnemonic/private key import.
 * This is optional - your wallet may have its own setup mechanism.
 */
export interface WalletProviderWithSetup extends WalletProvider {
  /**
   * Initialize wallet from a mnemonic phrase.
   */
  initFromMnemonic(mnemonic: string): Promise<void>

  /**
   * Initialize wallet from a private key.
   */
  initFromPrivateKey(privateKey: string): Promise<void>

  /**
   * Generate a new wallet and return the mnemonic.
   */
  generateNew(): Promise<string>
}
