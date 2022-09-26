# `@airgap/beacon-lambda-transformer`

## Getting Started

### Install the package

```shell
npm install @airgap/beacon-lambda-transformer
# or
yarn add @airgap/beacon-lambda-transformer
```

## Usage

```ts
import { lambdaOfOperations } from '@airgap/beacon-lambda-transformer'

const transactions = [
  {
    destination: 'KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH',
    kind: 'transaction',
    amount: 0,
    parameters: {
      entrypoint: 'withdraw',
      value: { int: '10000' }
    }
  }
]

console.log(lambdaOfOperations([transaction], 'https://mainnet.api.tez.ie' /* RPC Endpoint */))
```

```json
[
  {
    "prim": "DROP"
  },
  {
    "prim": "NIL",
    "args": [
      {
        "prim": "operation"
      }
    ]
  },
  {
    "prim": "PUSH",
    "args": [
      {
        "prim": "address"
      },
      {
        "string": "KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH%withdraw"
      }
    ]
  },
  {
    "prim": "CONTRACT",
    "args": [
      {
        "prim": "mutez"
      }
    ]
  },
  {
    "prim": "IF_NONE",
    "args": [
      [
        {
          "prim": "UNIT"
        },
        {
          "prim": "FAILWITH"
        }
      ],
      [
        {
          "prim": "PUSH",
          "args": [
            {
              "prim": "mutez"
            },
            {
              "int": "0"
            }
          ]
        },
        {
          "prim": "PUSH",
          "args": [
            {
              "prim": "mutez"
            },
            {
              "int": "10000"
            }
          ]
        },
        {
          "prim": "TRANSFER_TOKENS"
        },
        {
          "prim": "CONS"
        }
      ]
    ]
  }
]
```
