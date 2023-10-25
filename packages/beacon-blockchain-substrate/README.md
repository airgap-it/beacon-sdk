# `@mavrykdynamics/beacon-blockchain-substrate`

This package is part of the `@mavrykdynamics/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for `substrate` based blockchains. It can be used in combination with the `@mavrykdynamics/beacon-dapp` or `@mavrykdynamics/beacon-wallet` packages.

## Usage

```
import { DAppClient } from '@airga/beacon-dapp'
import { SubstrateBlockchain } from '@airga/beacon-blockchain-substrate'

const client = new DAppClient({
    name: 'Example DApp',
})

const substrateBlockchain = new SubstrateBlockchain()
client.addBlockchain(substrateBlockchain)
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)
