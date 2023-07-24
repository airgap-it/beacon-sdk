# `@airgap/beacon-blockchain-ic`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

This package adds support for the Internet Computer blockchain. It can be used in combination with the `@airgap/beacon-dapp` or `@airgap/beacon-wallet` packages.

## Usage

```
import { DAppClient } from '@airgap/beacon-dapp'
import { ICBlockchain } from '@airgap/beacon-blockchain-ic'

const client = new DAppClient({
    name: 'Example DApp',
})

const icBlockchain = new ICBlockchain()
client.addBlockchain(icBlockchain)
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)
