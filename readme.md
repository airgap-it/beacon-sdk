# Beacon SDK

[![npm](https://img.shields.io/npm/v/@airgap/beacon-sdk.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/beacon-sdk)
[![documentation](https://img.shields.io/badge/documentation-online-brightgreen.svg)](https://airgap-it.github.io/beacon-sdk/)
[![build](https://img.shields.io/travis/airgap-it/beacon-sdk.svg)](https://travis-ci.org/airgap-it/beacon-sdk/)
[![codecov](https://img.shields.io/codecov/c/gh/airgap-it/beacon-sdk.svg)](https://codecov.io/gh/airgap-it/beacon-sdk/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> Connect Wallets with dApps on Tezos

[Beacon](https://walletbeacon.io) is the implementation of the wallet interaction standard [tzip-10](https://gitlab.com/tzip/tzip/blob/master/proposals/tzip-10/tzip-10.md) which describes the connnection of a dApp with a wallet.

## Intro

The `beacon-sdk` simplifies and abstracts the communication between dApps and wallets over different transport layers.

### Documentation

The documentation can be found [here](https://docs.walletbeacon.io/).

### Example

```ts
const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestPermissions()
  .then((permissions) => {
    console.log('got permissions', permissions)
  })
  .catch((error) => console.log(error))
```

### Requirements

```
npm >= 6
NodeJS >= 10
```

Everything else gets installed automatically using `npm install`.

### Clone and Run

```
$ git clone https://github.com/airgap-it/beacon-sdk.git
$ cd beacon-sdk
$ npm install
$ npm test
```
