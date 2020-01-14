# Beacon SDK

[![npm](https://img.shields.io/npm/v/@airgap/beacon-sdk.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/beacon-sdk)
[![documentation](https://img.shields.io/badge/documentation-online-brightgreen.svg)](https://airgap-it.github.io/beacon-sdk/)
[![build](https://img.shields.io/travis/airgap-it/beacon-sdk.svg)](https://travis-ci.org/airgap-it/beacon-sdk/)
[![codecov](https://img.shields.io/codecov/c/gh/airgap-it/beacon-sdk.svg)](https://codecov.io/gh/airgap-it/beacon-sdk/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Intro

The `beacon-sdk` simplifies and abstracts the communication between dapps and wallets over different transport layers. 

### Example

```ts
const client = new DAppClient('My Sample DApp')
client
  .init()
  .then(() => {
    client
      .requestPermissions()
      .then(permissions => {
        console.log('got permissions', permissions)
      })
      .catch(error => console.log(error))
  })
  .catch(error => console.error(error))
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
