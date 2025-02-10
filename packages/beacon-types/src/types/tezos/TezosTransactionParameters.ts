import { MichelineMichelsonV1Expression } from './MichelineMichelsonV1Expression'

/**
 * @internalapi
 * @category Tezos
 */
export interface TezosTransactionParameters {
  entrypoint: 'default' | 'root' | 'do' | 'set_delegate' | 'remove_delegate' | 'deposit' | 'stake' | 'unstake' | 'finalize_unstake' | 'set_delegate_parameters' | string
  value: MichelineMichelsonV1Expression
}
