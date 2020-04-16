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

export type TezosOperations =
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
