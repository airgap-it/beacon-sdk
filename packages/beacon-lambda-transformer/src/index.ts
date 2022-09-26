import { Operation, InternalOperationKind, MichelsonJSON } from './typings'
import {
  buildContractAddress,
  buildIntPrim,
  buildStringPrim,
  someOrNone,
  valueOrUnit
} from './utils'
import { RpcClient } from './service/rpc'

/**
 * Convert JSON operations into a lambda value.
 *
 * @param ops List of operation (https://gitlab.com/tezos/tezos/-/blob/master/src/proto_014_PtKathma/lib_protocol/operation_repr.ml)
 * @returns Lambda in Micheline format.
 */
export async function lambdaOfOperations(
  ops: Operation[],
  rpcEndpoint: string
): Promise<MichelsonJSON> {
  const rpcClient = new RpcClient(rpcEndpoint)
  const mich = (await Promise.all(ops.map(lambdaOfOperation(rpcClient)))).flat()
  return [
    // Drop lambda argument
    {
      prim: 'DROP'
    },
    // Create empty list
    {
      prim: 'NIL',
      args: [{ prim: 'operation' }]
    },
    ...mich
  ]
}

const lambdaOfOperation =
  (rpc: RpcClient) =>
  async (op: Operation): Promise<MichelsonJSON> => {
    switch (op.kind) {
      case InternalOperationKind.Delegation:
        return [
          {
            prim: 'PUSH',
            args: [
              { prim: 'option', args: [{ prim: 'key_hash' }] },
              someOrNone(op.delegate ? buildStringPrim(op.delegate) : undefined)
            ]
          }, // Push the delegate address to the top of the stack.
          {
            prim: 'SET_DELEGATE'
          }, // Create a delegation operation and add it to the top of the stack.
          {
            prim: 'CONS'
          } // Append to the list of operations.
        ]
      case InternalOperationKind.Origination:
        const storageField = op.script.code[1]
        if (!('args' in storageField) || !Array.isArray(storageField.args)) {
          throw new Error('Expected contract code to have a storage type')
        }
        const storageType = storageField.args[0]
        return [
          {
            prim: 'PUSH',
            args: [storageType, op.script.storage]
          }, // Push the initial storage to the top of the stack.
          {
            prim: 'PUSH',
            args: [{ prim: 'mutez' }, buildIntPrim(op.balance)]
          }, // Push the initial balance to the top of the stack.
          {
            prim: 'PUSH',
            args: [
              { prim: 'option', args: [{ prim: 'key_hash' }] },
              someOrNone(op.delegate ? buildStringPrim(op.delegate) : undefined)
            ]
          }, // Push the delegate address to the top of the stack.
          {
            prim: 'CREATE_CONTRACT',
            args: op.script.code
          }, // Create a origination operation and add it to the top of the stack.
          {
            prim: 'SWAP'
          },
          {
            prim: 'DROP'
          },
          {
            prim: 'CONS'
          } // Append to the list of operations.
        ]
      case InternalOperationKind.Transaction:
        const jsonValue = op.parameters?.value
        const argType = await rpc.getEntrypointType(op.destination, op.parameters?.entrypoint)
        return [
          // Add the destination address to the stack
          {
            prim: 'PUSH',
            args: [
              { prim: 'address' },
              { string: buildContractAddress(op.destination, op.parameters?.entrypoint) }
            ]
          },
          // Build a reference to the contract
          {
            prim: 'CONTRACT',
            args: [argType]
          },
          // Check if the reference to the contract is valid.
          {
            prim: 'IF_NONE',
            args: [
              // Contract not valid
              [
                { prim: 'UNIT' }, // Push Unit valid to the top of the stack.
                { prim: 'FAILWITH' } // Fail and rollback the whole transaction with the latest value in the stack.
              ],
              // Contract valid
              [
                {
                  prim: 'PUSH',
                  args: [{ prim: 'mutez' }, { int: op.amount.toString() }]
                }, // Push the amount to be transferred to the top of the stack
                {
                  prim: 'PUSH',
                  args: [argType, valueOrUnit(jsonValue)]
                }, // Push a Unit value to the top of the stack.
                {
                  prim: 'TRANSFER_TOKENS'
                }, // Create a transaction operation and add it to the top of the stack.
                {
                  prim: 'CONS'
                } // Append to the list of operations.
              ]
            ]
          }
        ]
      default:
        throw new Error(`Unexpected operation kind ${op.kind}.`)
    }
  }
