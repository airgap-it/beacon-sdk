import { MichelineMichelsonV1Expression } from './MichelineMichelsonV1Expression'
import { TezosOperationType } from './TezosOperationType'

export type MetadataBalanceUpdatesKindEnum =
  | 'contract'
  | 'freezer'
  | 'accumulator'
  | 'burned'
  | 'commitment'
  | 'minted'
  | 'staking'

export type MetadataBalanceUpdatesOriginEnum =
  | 'block'
  | 'migration'
  | 'subsidy'
  | 'simulation'
  | 'delayed_operation'

export type MetadataBalanceUpdatesCategoryEnum = METADATA_BALANCE_UPDATES_CATEGORY

export enum METADATA_BALANCE_UPDATES_CATEGORY {
  BAKING_BONUSES = 'baking bonuses',
  BAKING_REWARDS = 'baking rewards',
  BLOCK_FEES = 'block fees',
  BONDS = 'bonds',
  BOOTSTRAP = 'bootstrap',
  BURNED = 'burned',
  COMMITMENT = 'commitment',
  DELEGATE_DENOMINATOR = 'delegate_denominator',
  DELEGATOR_NUMERATOR = 'delegator_numerator',
  DEPOSITS = 'deposits',
  ENDORSING_REWARDS = 'endorsing rewards',
  INVOICE = 'invoice',
  LOST_ENDORSING_REWARDS = 'lost endorsing rewards',
  MINTED = 'minted',
  NONCE_REVELATION_REWARDS = 'nonce revelation rewards',
  PUNISHMENTS = 'punishments',
  SMART_ROLLUP_REFUTATION_PUNISHMENTS = 'smart_rollup_refutation_punishments',
  SMART_ROLLUP_REFUTATION_REWARDS = 'smart_rollup_refutation_rewards',
  STORAGE_FEES = 'storage fees',
  SUBSIDY = 'subsidy',
  UNSTAKED_DEPOSITS = 'unstaked_deposits'
}

export type FrozenStaker = SingleStaker | SharedStaker | Baker

export type Staker = SingleStaker | SharedStaker

export interface SingleStaker {
  contract: string
  delegate: string
}

export interface SharedStaker {
  delegate: string
}

export interface Baker {
  baker: string
}

export type BondId = {
  smart_rollup: string
}

export type InternalOperationResultKindEnum =
  | TezosOperationType.TRANSACTION
  | TezosOperationType.ORIGINATION
  | TezosOperationType.DELEGATION
  | TezosOperationType.EVENT

export interface TransactionOperationParameter {
  entrypoint: string
  value: MichelineMichelsonV1Expression
}

export interface ScriptedContracts {
  code: MichelineMichelsonV1Expression[]
  storage: MichelineMichelsonV1Expression
}

export type ContractBigMapDiff = ContractBigMapDiffItem[]

export interface ContractBigMapDiffItem {
  key_hash?: string
  key?: MichelineMichelsonV1Expression
  value?: MichelineMichelsonV1Expression
  action?: DiffActionEnum
  big_map?: string
  source_big_map?: string
  destination_big_map?: string
  key_type?: MichelineMichelsonV1Expression
  value_type?: MichelineMichelsonV1Expression
}

export type DiffActionEnum = 'update' | 'remove' | 'copy' | 'alloc'
export type LazyStorageDiff = LazyStorageDiffBigMap | LazyStorageDiffSaplingState

export interface LazyStorageDiffBigMap {
  kind: 'big_map'
  id: string
  diff: LazyStorageDiffBigMapItems
}

export interface LazyStorageDiffSaplingState {
  kind: 'sapling_state'
  id: string
  diff: LazyStorageDiffSaplingStateItems
}

export interface LazyStorageDiffBigMapItems {
  action: DiffActionEnum
  updates?: LazyStorageDiffUpdatesBigMap[]
  source?: string
  key_type?: MichelineMichelsonV1Expression
  value_type?: MichelineMichelsonV1Expression
}

export interface LazyStorageDiffUpdatesBigMap {
  key_hash: string
  key: MichelineMichelsonV1Expression
  value?: MichelineMichelsonV1Expression
}

export interface LazyStorageDiffSaplingStateItems {
  action: DiffActionEnum
  updates?: LazyStorageDiffUpdatesSaplingState
  source?: string
  memo_size?: number
}

export interface LazyStorageDiffUpdatesSaplingState {
  commitments_and_ciphertexts: CommitmentsAndCiphertexts[]
  nullifiers: string[]
}

export type CommitmentsAndCiphertexts = [string, SaplingTransactionCiphertext]

export interface SaplingTransactionCiphertext {
  cv: string
  epk: string
  payload_enc: string
  nonce_enc: string
  payload_out: string
  nonce_out: string
}

export enum PvmKind {
  WASM2 = 'wasm_2_0_0',
  ARITH = 'arith',
  RISCV = 'riscv'
}

export interface SmartRollupPublishCommitment {
  compressed_state: string
  inbox_level: number
  predecessor: string
  number_of_ticks: string
}
