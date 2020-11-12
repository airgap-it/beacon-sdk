# Beacon SDK

[![npm](https://img.shields.io/npm/v/@airgap/beacon-sdk.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/beacon-sdk)
[![documentation](https://img.shields.io/badge/documentation-online-brightgreen.svg)](https://airgap-it.github.io/beacon-sdk/)
[![build](https://img.shields.io/travis/airgap-it/beacon-sdk.svg)](https://travis-ci.org/airgap-it/beacon-sdk/)
[![codecov](https://img.shields.io/codecov/c/gh/airgap-it/beacon-sdk.svg)](https://codecov.io/gh/airgap-it/beacon-sdk/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> Connect Wallets with dApps on Tezos

[Beacon](https://walletbeacon.io) is the implementation of the wallet interaction standard [tzip-10](https://gitlab.com/tzip/tzip/blob/master/proposals/tzip-10/tzip-10.md) which describes the connnection of a dApp with a wallet.

## Version 2

Version 2 is currently under development in the `feat/v2` branch.

There are only minimal breaking changes from a developer perspective, but there are some breaking changes in the communication protocol between dApps and Extensions / Wallets. We are currently in the process of finalizing v2 and updating all wallets, so dApps can be upgraded seamlessly without any compatibility issues.

You can install v2 to give it a try. It should already be stable for development, but please don't use it in production.

```
npm i --save @airgap/beacon-sdk@2
```

## Intro

The `beacon-sdk` simplifies and abstracts the communication between dApps and wallets over different transport layers.

The SDK is available on other platforms:

- [Beacon Android SDK (Kotlin)](https://github.com/airgap-it/beacon-android-sdk)
- Beacon iOS SDK (Swift) (coming soon)

## Documentation

The documentation can be found [here](https://docs.walletbeacon.io/).

## Installation

```
npm i --save @airgap/beacon-sdk
```

## Example

```ts
const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestPermissions()
  .then((permissions) => {
    console.log('got permissions', permissions)
  })
  .catch((error) => console.log(error))
```

## Development

### Requirements

```
npm >= 6
NodeJS >= 10
```

### Clone & Run

```
$ git clone https://github.com/airgap-it/beacon-sdk.git
$ cd beacon-sdk
$ npm install
$ npm test
```
