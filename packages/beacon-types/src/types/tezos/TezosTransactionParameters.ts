import { MichelineMichelsonV1Expression } from './MichelineMichelsonV1Expression'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosTransactionParameters {
  entrypoint:
    | 'default'
    | 'deposit'
    | 'do'
    | 'finalize_unstake'
    | 'remove_delegate'
    | 'root'
    | 'set_delegate'
    | 'set_delegate_parameters'
    | 'stake'
    | 'unstake'
    | string
  value: MichelineMichelsonV1Expression
}
