# `@airgap/beacon-blockchain-substrate`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for `substrate` based blockchains. It can be used in combination with the `@airgap/beacon-dapp` or `@airgap/beacon-wallet` packages.

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
