# `@airgap/beacon-blockchain-tezos`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for the `tezos` blockchain. It can be used in combination with the `@airgap/beacon-dapp` or `@airgap/beacon-wallet` packages.

## Usage

```
import { DAppClient } from '@airga/beacon-dapp'
import { TezosBlockchain } from '@airga/beacon-blockchain-tezos'

const client = new DAppClient({
    name: 'Example DApp',
})

const tezosBlockchain = new TezosBlockchain()
client.addBlockchain(tezosBlockchain)
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)
