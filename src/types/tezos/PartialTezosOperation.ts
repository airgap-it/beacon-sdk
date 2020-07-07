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

type omittedProperties = 'source' | 'fee' | 'counter' | 'gas_limit' | 'storage_limit'

export type PartialTezosDelegationOperation = Omit<TezosDelegationOperation, omittedProperties>
export type PartialTezosOriginationOperation = Omit<TezosOriginationOperation, omittedProperties>
export type PartialTezosRevealOperation = Omit<TezosRevealOperation, omittedProperties>
export type PartialTezosTransactionOperation = Omit<TezosTransactionOperation, omittedProperties>

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
