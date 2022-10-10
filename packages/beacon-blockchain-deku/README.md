# `@airgap/beacon-blockchain-deku`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for `deku` based blockchains. It can be used in combination with the `@airgap/beacon-dapp` or `@airgap/beacon-wallet` packages.

## Usage

```
import { DAppClient } from '@airga/beacon-dapp'
import { DekuBlockchain } from '@airga/beacon-blockchain-deku'

const client = new DAppClient({
    name: 'Example DApp',
})

const dekuBlockchain = new DekuBlockchain()
client.addBlockchain(dekuBlockchain)
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)
