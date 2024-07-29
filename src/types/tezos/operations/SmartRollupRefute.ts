import { TezosOperationType } from '../TezosOperationType'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosSmartRollupRefuteOperation extends TezosBaseOperation {
  kind: TezosOperationType.SMART_ROLLUP_REFUTE
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  rollup: string
  opponent: string
  refutation: SmartRollupRefutation
}

export type SmartRollupRefutation = SmartRollupRefutationStart | SmartRollupRefutationMove

export interface SmartRollupRefutationStart {
  refutation_kind: SmartRollupRefutationOptions.START
  player_commitment_hash: string
  opponent_commitment_hash: string
}

export interface SmartRollupRefutationMove {
  refutation_kind: SmartRollupRefutationOptions.MOVE
  choice: string
  step: SmartRollupRefutationMoveStep
}

export enum SmartRollupRefutationOptions {
  START = 'start',
  MOVE = 'move'
}

export type SmartRollupRefutationMoveStep =
  | SmartRollupRefutationMoveStepDissection[]
  | SmartRollupRefutationMoveStepProof

export type SmartRollupGameStatus =
  | SmartRollupRefuteGameStatusOptions.ONGOING
  | SmartRollupRefuteGameStatusEnded

export interface SmartRollupRefutationMoveStepDissection {
  state?: string
  tick: number
}

export interface SmartRollupRefutationMoveStepProof {
  pvm_step: string
  input_proof?: SmartRollupRefutationMoveInputProof
}

export enum SmartRollupRefuteGameStatusOptions {
  ONGOING = 'ongoing',
  ENDED = 'ended'
}

export interface SmartRollupRefuteGameStatusEnded {
  result: SmartRollupRefuteGameStatusResult
}

export type SmartRollupRefutationMoveInputProof =
  | SmartRollupRefutationMoveInputProofInbox
  | SmartRollupRefutationMoveInputProofReveal
  | SmartRollupRefutationMoveInputProofFirstInput

export type SmartRollupRefuteGameStatusResult =
  | SmartRollupRefuteGameEndedResultLoser
  | SmartRollupRefuteGameEndedResultDraw

export interface SmartRollupRefutationMoveInputProofInbox {
  input_proof_kind: SmartRollupInputProofKind.INBOX_PROOF
  level: number
  message_counter: string
  serialized_proof: string
}

export interface SmartRollupRefutationMoveInputProofReveal {
  input_proof_kind: SmartRollupInputProofKind.REVEAL_PROOF
  reveal_proof: SmartRollupRefuteRevealProofOptions
}

export interface SmartRollupRefutationMoveInputProofFirstInput {
  input_proof_kind: SmartRollupInputProofKind.FIRST_INPUT
}

export interface SmartRollupRefuteGameEndedResultLoser {
  kind: SmartRollupRefuteGameEndedPlayerOutcomes.LOSER
  reason: SmartRollupRefuteGameEndedReason
  player: string
}

export interface SmartRollupRefuteGameEndedResultDraw {
  kind: SmartRollupRefuteGameEndedPlayerOutcomes.DRAW
}

export enum SmartRollupInputProofKind {
  INBOX_PROOF = 'inbox_proof',
  REVEAL_PROOF = 'reveal_proof',
  FIRST_INPUT = 'first_input'
}

export type SmartRollupRefuteRevealProofOptions =
  | SmartRollupRefuteRevealProofRaw
  | SmartRollupRefuteRevealProofMetadata
  | SmartRollupRefuteRevealProofDalPage

export enum SmartRollupRefuteGameEndedPlayerOutcomes {
  LOSER = 'loser',
  DRAW = 'draw'
}

export enum SmartRollupRefuteGameEndedReason {
  CONFLICT_RESOLVED = 'conflict_resolved',
  TIMEOUT = 'timeout'
}

export enum SmartRollupRefuteRevealProofKind {
  RAW_DATA_PROOF = 'raw_data_proof',
  METADATA_PROOF = 'metadata_proof',
  DAL_PAGE_PROOF = 'dal_page_proof'
}

export interface SmartRollupRefuteRevealProofRaw {
  reveal_proof_kind: SmartRollupRefuteRevealProofKind.RAW_DATA_PROOF
  raw_data: string
}
export interface SmartRollupRefuteRevealProofMetadata {
  reveal_proof_kind: SmartRollupRefuteRevealProofKind.METADATA_PROOF
}
export interface SmartRollupRefuteRevealProofDalPage {
  reveal_proof_kind: SmartRollupRefuteRevealProofKind.DAL_PAGE_PROOF
  dal_page_id: {
    published_level: number
    slot_index: number
    page_index: number
  }
  dal_proof: string
}
