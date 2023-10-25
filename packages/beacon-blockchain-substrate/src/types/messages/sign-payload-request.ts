import { BlockchainMessage } from '/beacon-types'
import { SubstrateMessageType } from '../message-type'
import { SubstratePermissionScope } from '../permission-scope'

export interface SubstrateSignPayloadRequest extends BlockchainMessage<'substrate'> {
  blockchainData: {
    type: SubstrateMessageType.sign_payload_request
    scope: SubstratePermissionScope.sign_payload_json | SubstratePermissionScope.sign_payload_json

    // This type is the same as the "SignerPayloadJSON" of polkadot.js https://github.com/polkadot-js/api/blob/f169ca08a80ea9c3865dc545e03e921c50f0d284/packages/types/src/types/extrinsic.ts#L32
    payload:
      | {
          type: 'json'

          /**
           * @description The checkpoint hash of the block, in hex
           */
          blockHash: string

          /**
           * @description The checkpoint block number, in hex
           */
          blockNumber: string

          /**
           * @description The era for this transaction, in hex
           */
          era: string

          /**
           * @description The genesis hash of the chain, in hex
           */
          genesisHash: string

          /**
           * @description The encoded method (with arguments) in hex
           */
          method: string

          /**
           * @description The nonce for this transaction, in hex
           */
          nonce: string

          /**
           * @description The current spec version for the runtime
           */
          specVersion: string

          /**
           * @description The tip for this transaction, in hex
           */
          tip: string

          /**
           * @description The current transaction version for the runtime
           */
          transactionVersion: string

          /**
           * @description The applicable signed extensions for this runtime
           */
          signedExtensions: string[]

          /**
           * @description The version of the extrinsic we are dealing with
           */
          version: number
        }
      | {
          type: 'raw'
          isMutable: boolean
          dataType: 'bytes' | 'payload'
          data: string
        }

    mode: 'submit' | 'submit-and-return' | 'return'
  }
}
