# Introduction

Beacon is the implementation of the [tzip-10 proposal](https://gitlab.com/tzip/tzip/tree/master/proposals/tzip-10), which describes an interaction standard between a wallet and a dApp.

A dApp impelementing the [beacon-sdk](https://github.com/airgap-it/beacon-sdk) can build up a channel and send messages over a peer to peer communication layer to a wallet. This allows for a communication for example of a mobile wallet with a desktop application. The requests of the dApp are sent to the wallet, signed and returned to the application. The beacon-sdk can also communicate to chrome extensions if compatible ones are installed.

The beacon-sdk should allow developers to integrate this functionality with minimal coding, but still be customizable to support more complex flows.

An example dapp can be found here: [WalletBeacon.io](https://walletbeacon.io) [Source Code](https://github.com/airgap-it/beacon-example-dapp)

A chrome extension that can be used for development can be found here: [Beacon Extension](https://github.com/airgap-it/beacon-extension/releases)

For more information, read our [Getting Started](/beacon/getting-started-dapp/)
