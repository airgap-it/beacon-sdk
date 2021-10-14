# Beacon SDK

[![npm](https://img.shields.io/npm/v/@airgap/beacon-sdk.svg?colorB=brightgreen)](https://www.npmjs.com/package/@airgap/beacon-sdk)
[![documentation](https://img.shields.io/badge/documentation-online-brightgreen.svg)](https://airgap-it.github.io/beacon-sdk/)
[![GitHub Action](https://github.com/airgap-it/beacon-sdk/workflows/Build%2C%20Test%20and%20Analyze/badge.svg)](https://github.com/airgap-it/beacon-sdk/actions?query=workflow%3A%22Build%2C+Test+and+Analyze%22+branch%3Amain)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=airgap-it_beacon-sdk&metric=alert_status)](https://sonarcloud.io/dashboard?id=airgap-it_beacon-sdk)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> Connect Wallets with dApps on Tezos

[Beacon](https://walletbeacon.io) is the implementation of the wallet interaction standard [tzip-10](https://gitlab.com/tzip/tzip/blob/master/proposals/tzip-10/tzip-10.md) which describes the connnection of a dApp with a wallet.

## Intro

The `beacon-sdk` simplifies and abstracts the communication between dApps and wallets over different transport layers.

Developers that plan to develop complex smart contract interactions can use [Taquito](https://github.com/ecadlabs/taquito) with the `BeaconWallet`, which uses this SDK under the hood, but provides helpful methods to interact with contracts.

Besides this Typescript SDK, we also provide SDKs for native iOS and Android Wallets:

- [Beacon Android SDK (Kotlin)](https://github.com/airgap-it/beacon-android-sdk)
- [Beacon iOS SDK (Swift)](https://github.com/airgap-it/beacon-ios-sdk)

## Documentation

The documentation can be found [here](https://docs.walletbeacon.io/), technical documentation can be found [here](https://typedocs.walletbeacon.io/).

## Installation

```
npm i --save @airgap/beacon-sdk
```

## Example DApp integration

```ts
const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestPermissions() // Send a permission request and automatically show UI to the user to select his favorite wallet
  .then((permissions) => {
    // Account that has been shared by the wallet
    console.log('got permissions', permissions)
  })
  .catch((error) => console.log(error))
```

For a more complete example, take a look at the `example-dapp.html` file.

## Example Wallet integration

```ts
const client = new WalletClient({ name: 'My Wallet' })
await client.init() // Establish P2P connection

client
  .connect(async (message) => {
    // Example: Handle PermissionRequest. A wallet should handle all request types
    if (message.type === BeaconMessageType.PermissionRequest) {
      // Show a UI to the user where he can confirm sharing an account with the DApp

      const response: PermissionResponseInput = {
        type: BeaconMessageType.PermissionResponse,
        network: message.network, // Use the same network that the user requested
        scopes: [PermissionScope.OPERATION_REQUEST], // Ignore the scopes that have been requested and instead give only operation permissions
        id: message.id,
        publicKey: 'tezos public key'
      }

      // Send response back to DApp
      await client.respond(response)
    }
  })
  .catch((error) => console.error('connect error', error))
```

For a more complete example, take a look at the `example-wallet.html` file.

## Adding a wallet to beacon-sdk

Please create a PR and add your wallet [here](https://github.com/airgap-it/beacon-sdk/blob/master/scripts/generate-wallet-list.ts).

For iOS wallets, the wallet needs to define a custom url scheme to support the same-device functionality.

## Development

```
$ npm i
$ npm run build
$ npm run test
```

Once the SDK is built, you can open the `example-dapp.html` file in your browser and try out the basic functionality. To support browser extensions as well, the file should be viewed over a webserver. You can easily start one with `python -m SimpleHTTPServer 8000` and then open the file with `http://localhost:8000/example-dapp.html`.
