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

## Contributing Wallet Integrations

The Beacon SDK dynamically loads wallet lists from GitHub, making it easy for wallet developers to add or update their wallets without waiting for SDK releases.

### How Wallet Lists Work

- Wallet lists are loaded remotely from `https://raw.githubusercontent.com/airgap-it/beacon-sdk/main/wallet-lists/`
- Logos are embedded as base64 data URIs directly in the JSON files
- If the remote list is unavailable, the SDK falls back to bundled wallet lists
- Changes to wallet lists are live once a PR is merged - no SDK release required!

### Adding or Updating a Wallet

To add your wallet or update an existing entry:

1. **Add your logo** to `/assets/logos/`
   - Filename must match your wallet key (e.g., `my_wallet_chrome.png` or `my_wallet_chrome.svg`)
   - **Logo Requirements:**
     - Format: PNG or SVG
     - Dimensions: Maximum 256x256 pixels for PNG files
     - File size: Maximum 25KB
     - Quality: Clear, high-quality logo on transparent background preferred

2. **Update the wallet list** in the appropriate blockchain file:
   - `/scripts/blockchains/tezos.ts` for Tezos wallets
   - `/scripts/blockchains/substrate.ts` for Substrate wallets
   - `/scripts/blockchains/tezos-sapling.ts` for Tezos Sapling wallets

3. **Run the build script** to generate the JSON files:
   ```bash
   npm run generate:wallet-list
   ```

4. **Submit a Pull Request**
   - Automated checks will validate your logo meets requirements
   - Include a brief description of your wallet
   - The JSON files will be automatically regenerated on merge

### Example Wallet Entry

Add your wallet to the appropriate TypeScript file:

```typescript
{
  key: 'my_wallet_chrome',
  id: 'chrome-extension-id',
  name: 'My Wallet',
  shortName: 'MyWallet',
  color: 'rgb(52, 147, 218)',
  logo: 'my_wallet_chrome.png', // Must match filename in /assets/logos/
  link: 'https://mywallet.com/'
}
```

### Important Notes for DApp Developers

- Browser extensions need access to `raw.githubusercontent.com` for fetching wallet lists
- If your extension has CSP (Content Security Policy) restrictions, add `raw.githubusercontent.com` to allowed domains
- The SDK will automatically fall back to bundled wallet lists if GitHub is not accessible
- Wallet lists include embedded base64 logos, so no separate image requests are needed

## Installation

```
npm i --save @airgap/beacon-sdk
```

## Example DApp integration

```ts
import { DAppClient } from '@airgap/beacon-sdk'

const dAppClient = new DAppClient({ name: 'My Sample DApp' })

// Listen for all the active account changes
dAppClient.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async (account) => {
  // An active account has been set, update the dApp UI
  console.log(`${BeaconEvent.ACTIVE_ACCOUNT_SET} triggered: `, account)
})

try {
  console.log('Requesting permissions...')
  const permissions = await dAppClient.requestPermissions()
  console.log('Got permissions:', permissions.address)
} catch (error) {
  console.error('Got error:', error)
}
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

## Development

```
$ npm i
$ npm run build
$ npm run test
```

Once the SDK is built, you can open the `dapp.html` or `wallet.html` file in your browser and try out the basic functionality. To support browser extensions as well, the file should be viewed over a webserver. You can navigate to the example folder and easily start one with `python -m SimpleHTTPServer 8000` (or `python3 -m http.server 8000` with Python 3.x) and then open the examples with `http://localhost:8000/`.
