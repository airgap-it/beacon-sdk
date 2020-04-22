import {
  TezosActivateAccountOperation,
  TezosBallotOperation,
  TezosDelegationOperation,
  TezosDoubleBakingEvidenceOperation,
  TezosEndorsementOperation,
  TezosOriginationOperation,
  TezosProposalOperation,
  TezosRevealOperation,
  TezosSeedNonceRevelationOperation,
  TezosTransactionOperation
} from '../..'

export type TezosOperations =  // TODO: Rename to TezosOperation
  | TezosActivateAccountOperation
  | TezosBallotOperation
  | TezosDelegationOperation
  | TezosDoubleBakingEvidenceOperation
  | TezosEndorsementOperation
  | TezosOriginationOperation
  | TezosProposalOperation
  | TezosRevealOperation
  | TezosSeedNonceRevelationOperation
  | TezosTransactionOperation
