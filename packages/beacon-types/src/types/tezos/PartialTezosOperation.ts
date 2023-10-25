import { Optional } from '@mavrykdynamics/beacon-types'
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
