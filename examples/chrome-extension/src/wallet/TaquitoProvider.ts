/**
 * TaquitoProvider - Example WalletProvider Implementation
 *
 * This is a reference implementation using Taquito for signing.
 * It demonstrates how to implement the WalletProvider interface.
 *
 * REPLACE THIS with your own wallet's signing implementation.
 * This is just for demonstration purposes.
 *
 * Your implementation might:
 * - Use hardware wallet signing (Ledger, etc.)
 * - Use a different cryptographic library
 * - Integrate with your existing key management system
 */

import { InMemorySigner } from '@taquito/signer'
import { TezosToolkit, OpKind } from '@taquito/taquito'
import * as bip39 from 'bip39'
import type {
  WalletProviderWithSetup,
  WalletInfo,
  SignPayloadResult,
  SignOperationResult
} from './WalletProvider'
import type { NetworkConfig, TezosOperation } from '../beacon/types'

export class TaquitoProvider implements WalletProviderWithSetup {
  private signer: InMemorySigner | null = null
  private address: string | null = null
  private publicKey: string | null = null

  isReady(): boolean {
    return this.signer !== null && this.address !== null && this.publicKey !== null
  }

  getWalletInfo(): WalletInfo | null {
    if (!this.address || !this.publicKey) return null
    return {
      address: this.address,
      publicKey: this.publicKey
    }
  }

  async signPayload(payload: string, signingType: 'raw' | 'operation' | 'micheline'): Promise<SignPayloadResult> {
    if (!this.signer) {
      throw new Error('Wallet not initialized')
    }

    // Normalize payload - remove 0x prefix if present
    const normalizedPayload = payload.startsWith('0x') ? payload.slice(2) : payload

    const result = await this.signer.sign(normalizedPayload)

    // Return the prefixed signature (e.g., edsig...)
    const signature = result.prefixSig || result.sig

    if (!signature) {
      throw new Error('Signing failed - no signature returned')
    }

    return { signature }
  }

  async signOperation(operations: TezosOperation[], network: NetworkConfig): Promise<SignOperationResult> {
    if (!this.signer) {
      throw new Error('Wallet not initialized')
    }

    if (!network.rpcUrl) {
      throw new Error('Network RPC URL is required for operations')
    }

    const tezos = new TezosToolkit(network.rpcUrl)
    tezos.setProvider({ signer: this.signer })

    const taquitoOps = operations.map((op) => this.mapOperationToTaquito(op))
    const batch = tezos.contract.batch(taquitoOps)
    const result = await batch.send()

    return { opHash: result.hash }
  }

  async initFromMnemonic(mnemonic: string): Promise<void> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase')
    }

    this.signer = await InMemorySigner.fromMnemonic({
      mnemonic,
      password: '',
      derivationPath: "44'/1729'/0'/0'",
      curve: 'ed25519'
    })

    this.address = await this.signer.publicKeyHash()
    this.publicKey = await this.signer.publicKey()
  }

  async initFromPrivateKey(privateKey: string): Promise<void> {
    if (!privateKey.startsWith('edsk')) {
      throw new Error('Private key must start with "edsk"')
    }

    this.signer = await InMemorySigner.fromSecretKey(privateKey)
    this.address = await this.signer.publicKeyHash()
    this.publicKey = await this.signer.publicKey()
  }

  async generateNew(): Promise<string> {
    const mnemonic = bip39.generateMnemonic(256) // 24 words
    await this.initFromMnemonic(mnemonic)
    return mnemonic
  }

  private mapOperationToTaquito(op: TezosOperation): any {
    const toNumber = (value: string | undefined): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }

    switch (op.kind) {
      case 'transaction':
        return {
          kind: OpKind.TRANSACTION,
          to: op.destination,
          amount: toNumber(op.amount) ?? 0,
          mutez: true,
          source: op.source || this.address,
          fee: toNumber(op.fee),
          gasLimit: toNumber(op.gas_limit),
          storageLimit: toNumber(op.storage_limit),
          parameter: op.parameters
        }

      case 'delegation':
        return {
          kind: OpKind.DELEGATION,
          source: op.source || this.address,
          delegate: op.delegate,
          fee: toNumber(op.fee),
          gasLimit: toNumber(op.gas_limit),
          storageLimit: toNumber(op.storage_limit)
        }

      case 'reveal':
        return {
          kind: OpKind.REVEAL,
          source: op.source || this.address,
          publicKey: op.public_key || this.publicKey,
          fee: toNumber(op.fee),
          gasLimit: toNumber(op.gas_limit),
          storageLimit: toNumber(op.storage_limit)
        }

      case 'origination':
        return {
          kind: OpKind.ORIGINATION,
          source: op.source || this.address,
          balance: toNumber(op.balance) ?? 0,
          code: op.script?.code,
          init: op.script?.storage,
          fee: toNumber(op.fee),
          gasLimit: toNumber(op.gas_limit),
          storageLimit: toNumber(op.storage_limit)
        }

      default:
        throw new Error(`Unsupported operation kind: ${op.kind}`)
    }
  }

  clear(): void {
    this.signer = null
    this.address = null
    this.publicKey = null
  }
}
