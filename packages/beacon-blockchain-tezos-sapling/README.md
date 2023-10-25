# `@mavrykdynamics/beacon-blockchain-tezos-sapling`

This package is part of the `@mavrykdynamics/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for `tezos-sapling`, the sapling integration on the Tezos blockchain. It can be used in combination with the `@mavrykdynamics/beacon-dapp` or `@mavrykdynamics/beacon-wallet` packages.

## Usage

```
import { DAppClient } from '@airga/beacon-dapp'
import { TezosSaplingBlockchain } from '@airga/beacon-blockchain-tezos-sapling'

const client = new DAppClient({
    name: 'Example DApp',
})

const tezosSaplingBlockchain = new TezosSaplingBlockchain()
client.addBlockchain(tezosSaplingBlockchain)
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)
