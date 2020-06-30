# Introduction

Beacon is the implementation of the [tzip-10 proposal](https://gitlab.com/tzip/tzip/tree/master/proposals/tzip-10), which describes an interaction standard between a wallet and a dApp.

A dApp impelementing the [beacon-sdk](https://github.com/airgap-it/beacon-sdk) can build up a channel and send messages over a peer to peer communication layer to a wallet. This allows for a communication for example of a mobile wallet with a desktop application. The requests of the dApp are sent to the wallet, signed and returned to the application. The `beacon-sdk` can also communicate to chrome extensions if compatible ones are installed.

The `beacon-sdk` should allow developers to integrate this functionality with minimal coding, but still be customizable to support more complex flows.

For more information on how to integrate the `beacon-sdk` in your DApp, read our [Getting Started](/beacon/02.getting-started-dapp.html) guide.

## DApps

- [WalletBeacon.io](https://walletbeacon.io) [Source Code](https://github.com/airgap-it/beacon-example-dapp) is the high-level explanation of beacon and is itself a DApp.
- [Beacon Example](https://airgap-it.github.io/beacon-vue-example/) [Source Code](https://github.com/airgap-it/beacon-vue-example) is a small sample application built for the sole purpose of showcasing beacon integration.

## Extensions

- [Beacon Extension](https://chrome.google.com/webstore/detail/gpfndedineagiepkpinficbcbbgjoenn/) is the official extension by the beacon team. It is the most feature complete way of interacting with Beacon DApps at the moment.

## Mobile Wallets

- [AirGap Wallet](https://airgap.it/) is a mobile application that supports the beacon.
