# Introduction

Beacon is the implementation of the [tzip-10 proposal](https://gitlab.com/tzip/tzip/tree/master/proposals/tzip-10), which describes an interaction standard between a wallet and a dApp.

A dApp impelementing the [beacon-sdk](https://github.com/airgap-it/beacon-sdk) can build up a channel and send messages over a peer to peer communication layer to a wallet. This allows for a communication for example of a mobile wallet with a desktop application. The requests of the dApp are sent to the wallet, signed and returned to the application. The `beacon-sdk` can also communicate to chrome extensions if compatible ones are installed.

The `beacon-sdk` should allow developers to integrate this functionality with minimal coding, but still be customizable to support more complex flows.

For more information on how to integrate the `beacon-sdk` in your DApp, read our [Getting Started](/beacon/02.getting-started-dapp.html) guide.

To get started, install the beacon-sdk from NPM:

`npm install --save @airgap/beacon-sdk`

## Upgrading from v1 to v2

Beacon SDK v2 introduces some some breaking changes from a developer perspective, most of the changes are internal, specifically in the communication protocol between dApps and Extensions/Wallets. All major Wallets that support Beacon (tzip-10) have been updated to support both v1 and v2 DApps.

We highly encourage developers to upgrade to v2. Besides stability improvements, the most notable new features are:

- Support for multiple browser extensions (eg. Thanos and Spire)
- Support for mobile, browser and desktop Wallets
- Mobile support via Deeplinking
- Secure and encrypted communication between DApp and Browser Extension

## DApps

- [WalletBeacon.io](https://walletbeacon.io) [Source Code](https://github.com/airgap-it/beacon-example-dapp) is the high-level explanation of beacon and is itself a DApp.
- [Beacon Example](https://airgap-it.github.io/beacon-vue-example/) [Source Code](https://github.com/airgap-it/beacon-vue-example) is a small sample application built for the sole purpose of showcasing beacon integration.

## Wallets

A list of wallets with support for beacon is available [here](/supported-wallets.html).
