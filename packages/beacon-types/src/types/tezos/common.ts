import { MichelineMichelsonV1Expression } from './MichelineMichelsonV1Expression'
import { TezosOperationType } from './OperationTypes'

export interface OperationContentsAndResultMetadata {
  balance_updates?: OperationMetadataBalanceUpdates[]
}

export interface OperationMetadataBalanceUpdates {
  kind: MetadataBalanceUpdatesKindEnum
  contract?: string
  change: string
  origin?: MetadataBalanceUpdatesOriginEnum
  category?: MetadataBalanceUpdatesCategoryEnum
  staker?: FrozenStaker | Staker
  delegate?: string
  participation?: boolean
  revelation?: boolean
  committer?: string
  bond_id?: BondId
  cycle?: number
  delegator?: string
}

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

export type OperationResultStatusEnum = 'applied' | 'failed' | 'skipped' | 'backtracked'

export type InternalOperationResultKindEnum =
  | TezosOperationType.TRANSACTION
  | TezosOperationType.ORIGINATION
  | TezosOperationType.DELEGATION
  | TezosOperationType.EVENT

export interface OperationResultUpdateConsensusKey {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  errors?: TezosGenericOperationError[]
}

export interface OperationResultSetDepositsLimit {
  status: OperationResultStatusEnum
  consumed_gas?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
}

export interface OperationMetadataBalanceUpdates {
  kind: MetadataBalanceUpdatesKindEnum
  contract?: string
  change: string
  origin?: MetadataBalanceUpdatesOriginEnum
  category?: MetadataBalanceUpdatesCategoryEnum
  staker?: FrozenStaker | Staker
  delegate?: string
  participation?: boolean
  revelation?: boolean
  committer?: string
  bond_id?: BondId
  cycle?: number
  delegator?: string
}

export interface InternalOperationResult {
  kind: InternalOperationResultKindEnum
  source: string
  nonce: number
  amount?: string
  destination?: string
  parameters?: TransactionOperationParameter
  public_key?: string
  balance?: string
  delegate?: string
  script?: ScriptedContracts
  value?: MichelineMichelsonV1Expression
  limit?: string
  result: InternalOperationResultEnum
  type?: MichelineMichelsonV1Expression
  tag?: string
  payload?: MichelineMichelsonV1Expression
}

export interface TezosGenericOperationError {
  kind: string
  id: string
  delegate?: string
}

export interface TransactionOperationParameter {
  entrypoint: string
  value: MichelineMichelsonV1Expression
}

export interface ScriptedContracts {
  code: MichelineMichelsonV1Expression[]
  storage: MichelineMichelsonV1Expression
}

export type InternalOperationResultEnum =
  | OperationResultReveal
  | OperationResultTransaction
  | OperationResultDelegation
  | OperationResultOrigination
  | OperationResultEvent

export interface OperationResultReveal {
  status: OperationResultStatusEnum
  consumed_gas?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
}

export interface OperationResultTransaction {
  status: OperationResultStatusEnum
  storage?: MichelineMichelsonV1Expression
  big_map_diff?: ContractBigMapDiff
  balance_updates?: OperationBalanceUpdates
  ticket_updates?: TicketUpdates[]
  ticket_receipt?: TicketReceipt[]
  originated_contracts?: string[]
  consumed_gas?: string
  storage_size?: string
  paid_storage_size_diff?: string
  allocated_destination_contract?: boolean
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
  lazy_storage_diff?: LazyStorageDiff[]
  ticket_hash?: string
}

export interface OperationResultReveal {
  status: OperationResultStatusEnum
  consumed_gas?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
}

export interface OperationResultDelegation {
  status: OperationResultStatusEnum
  consumed_gas?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
}

export interface OperationResultOrigination {
  status: OperationResultStatusEnum
  big_map_diff?: ContractBigMapDiff
  balance_updates?: OperationBalanceUpdates
  originated_contracts?: string[]
  consumed_gas?: string
  storage_size?: string
  paid_storage_size_diff?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
  lazy_storage_diff?: LazyStorageDiff[]
}

export interface OperationResultEvent {
  status: OperationResultStatusEnum
  consumed_milligas?: string
  errors?: TezosGenericOperationError[]
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

export type OperationBalanceUpdates = OperationMetadataBalanceUpdates[]

export interface TicketUpdates {
  ticket_token: {
    ticketer: string
    content_type: MichelineMichelsonV1Expression
    content: MichelineMichelsonV1Expression
  }
  updates: {
    account: string
    amount: string
  }[]
}
export type TicketReceipt = TicketUpdates

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

export interface OperationContentsAndResultMetadataExtended1 {
  balance_updates?: OperationMetadataBalanceUpdates[]
  delegate: string
  consensus_power: number
  consensus_key: string
}

export interface OperationContentsAndResultMetadataExtended0 {
  balance_updates?: OperationMetadataBalanceUpdates[]
  delegate: string
  slots?: number[]
  endorsement_power?: number
  consensus_key?: string
}
export interface OperationResultRegisterGlobalConstant {
  status: OperationResultStatusEnum
  balance_updates?: OperationBalanceUpdates
  consumed_gas?: string
  storage_size?: string
  global_address?: string
  errors?: TezosGenericOperationError[]
  consumed_milligas?: string
}
