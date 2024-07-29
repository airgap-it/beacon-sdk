import {
  TezosAttestationOperation,
  TezosAttestationWithSlotOperation,
  TezosDoubleAttestationEvidenceOperation,
  TezosDoublePreAttestationEvidenceOperation,
  TezosDoublePreEndorsementEvidenceOperation,
  TezosDrainDelegateOperation,
  TezosEndorsementWithSlotOperation,
  TezosFailingNoopOperation,
  TezosIncreasePaidStorageOperation,
  TezosPreAttestationOperation,
  TezosRegisterGlobalConstantOperation,
  TezosSetDepositsLimitOperation,
  TezosSmartRollupAddMessagesOperation,
  TezosSmartRollupCementOperation,
  TezosSmartRollupExecuteOutboxMessageOperation,
  TezosSmartRollupOriginateOperation,
  TezosSmartRollupPublishOperation,
  TezosSmartRollupRecoverBondOperation,
  TezosSmartRollupRefuteOperation,
  TezosTransferTicketOperation,
  TezosUpdateConsensusKeyOperation,
  TezosVdfRevelationOperation
} from './operations'
import {Optional } from './optional'
import { TezosActivateAccountOperation } from './operations/ActivateAccount'
import { TezosBallotOperation } from './operations/Ballot'
import { TezosDelegationOperation } from './operations/Delegation'
import { TezosDoubleBakingEvidenceOperation } from './operations/DoubleBakingEvidence'
import { TezosEndorsementOperation } from './operations/Endorsement'
import { TezosOriginationOperation } from './operations/Origination'
import { TezosProposalOperation } from './operations/Proposal'
import { TezosRevealOperation } from './operations/Reveal'
import { TezosSeedNonceRevelationOperation } from './operations/SeedNonceRevelation'
import { TezosTransactionOperation } from './operations/Transaction'
import { TezosPreEndorsementOperation } from './operations/PreEndorsement'
import { TezosDalPublishCommitmentOperation } from './operations/DalPublishCommitment'

/**
 * @publicapi
 * @category Tezos
 */
export type omittedProperties = 'source' | 'fee' | 'counter' | 'gas_limit' | 'storage_limit'

/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosDelegationOperation = Optional<TezosDelegationOperation, omittedProperties>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosOriginationOperation = Optional<
  TezosOriginationOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosRevealOperation = Optional<TezosRevealOperation, omittedProperties>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosTransactionOperation = Optional<
  TezosTransactionOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSetDepositsLimitOperation = Optional<
  TezosSetDepositsLimitOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosRegisterGlobalConstantOperation = Optional<
  TezosRegisterGlobalConstantOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosTransferTicketOperation = Optional<
  TezosTransferTicketOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosIncreasePaidStorageOperation = Optional<
  TezosIncreasePaidStorageOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosUpdateConsensusKeyOperation = Optional<
  TezosUpdateConsensusKeyOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupOriginateOperation = Optional<
  TezosSmartRollupOriginateOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupAddMessagesOperation = Optional<
  TezosSmartRollupAddMessagesOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupExecuteOutboxMessageOperation = Optional<
  TezosSmartRollupExecuteOutboxMessageOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupPublishOperation = Optional<
  TezosSmartRollupPublishOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupCementOperation = Optional<
  TezosSmartRollupCementOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupRecoverBondOperation = Optional<
  TezosSmartRollupRecoverBondOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupRefuteOperation = Optional<
  TezosSmartRollupRefuteOperation,
  omittedProperties
>
/**
 * @internalapi
 * @category Tezos
 */
export type PartialTezosSmartRollupTimeoutOperation = Optional<
  TezosSmartRollupRefuteOperation,
  omittedProperties
>

export type PartialTezosDalPublishCommitmentOperation = Optional<
  TezosDalPublishCommitmentOperation,
  omittedProperties
>

/**
 * @publicapi
 * @category Tezos
 */
export type PartialTezosOperation =
  | TezosActivateAccountOperation
  | TezosBallotOperation
  | PartialTezosDelegationOperation
  | TezosDoubleBakingEvidenceOperation
  | TezosEndorsementOperation
  | PartialTezosOriginationOperation
  | TezosProposalOperation
  | PartialTezosRevealOperation
  | TezosSeedNonceRevelationOperation
  | PartialTezosTransactionOperation
  | TezosAttestationOperation
  | TezosPreAttestationOperation
  | TezosPreEndorsementOperation
  | PartialTezosSetDepositsLimitOperation
  | TezosDoublePreAttestationEvidenceOperation
  | TezosDoublePreEndorsementEvidenceOperation
  | TezosAttestationWithSlotOperation
  | TezosEndorsementWithSlotOperation
  | TezosDoubleAttestationEvidenceOperation
  | TezosFailingNoopOperation
  | PartialTezosRegisterGlobalConstantOperation
  | PartialTezosTransferTicketOperation
  | PartialTezosIncreasePaidStorageOperation
  | PartialTezosUpdateConsensusKeyOperation
  | TezosDrainDelegateOperation
  | TezosVdfRevelationOperation
  | PartialTezosSmartRollupOriginateOperation
  | PartialTezosSmartRollupAddMessagesOperation
  | PartialTezosSmartRollupExecuteOutboxMessageOperation
  | PartialTezosSmartRollupPublishOperation
  | PartialTezosSmartRollupCementOperation
  | PartialTezosSmartRollupRecoverBondOperation
  | PartialTezosSmartRollupRefuteOperation
  | PartialTezosSmartRollupTimeoutOperation
  | PartialTezosDalPublishCommitmentOperation
