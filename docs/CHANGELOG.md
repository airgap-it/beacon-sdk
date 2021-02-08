# Changelog

## 2.2.1 (2021-02-08)

#### Fixes

- **signing**: The validation of the `OPERATION` and `MICHELINE` payloads is now correct
- **alert**: The page no longer scrolls down when the alert opens
- **alert**: Alert width fixed on mobile
- **toast**: Toasts are now sticky to the top of the window, not the top of the page
- **toast**: Toast height fixed on iOS
- **toast**: If an acknowledge message is received after the response, it will be ignored
- **toast**: The close button will now always be shown in the "awaiting" state
- **toast**: Remove unnecessary "href" from link in error toast
- **toast**: New toasts that are triggered while another one is being shown will now be handled correctly

## 2.2.0 (2021-02-03)

#### Features

- **UI Improvements**: We changed the flow of the UI from the ground up. When a new message is sent from the dApp, the "request sent" toast now sticks to the top right of the page. It shows a loading animation and also includes the name (and logo) of the wallet where the request has been sent to. The toast will update whenever new information is received from the wallet (eg. request acknowledgement or response). Only the pairing information and details of errors will be displayed in a blocking alert. As always, all of these UI elements can be overwritten if dApp developers want to use their own UI.

- **UI Improvements**: Default UI Elements in Beacon now use Shadow Dom. This will encapsulate the styling of the UI elements, so the styling of the page will no longer affect the styling of the beacon-sdk UI elements, and vice versa.

- **Dark Mode**: The dApp developer can now choose between a "dark" and "light" color theme. This will change the look of both alerts and toasts.

- **Errors**: The `beacon-sdk` now allows for RPC-Errors to be passed in the `TRANSACTION_INVALID_ERROR` response. Errors MUST be displayed in the wallet. This change does not change that. It simply allows dApps that expect certain errors to provide more insights into what went wrong. dApps are not required to display the details of an error, but they can choose to do so if it improves the user experience.

- **Debug**: New debug methods have been introduced. To activate logs from the `beacon-sdk` during development, it is possible to call `setDebugEnabled(true)`. This will enable logs throughout the `beacon-sdk`.

The `beacon-sdk` will now also listen to the `beaconSdkDebugEnabled` variable on the global window object. This will allow browser extensions (eg. Spire) to set the debug flag to true on production websites, which will help debugging on production dApps.

- **UI Elements**: All default UI Elements / Event Handlers can be removed at once by setting the `disableDefaultEvents` flag in the `DAppClientOptions` to true. Keep in mind that this will also disable the Pairing Alert. If you want to keep the Pairing Alert, you will have to add those default handlers again. An example would be:

```ts
const client = new DAppClient({
  name: 'My Sample DApp',
  disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
  eventHandlers: {
    // To keep the pairing alert, we have to add the following default event handlers back
    [BeaconEvent.PAIR_INIT]: {
      handler: defaultEventCallbacks.PAIR_INIT
    },
    [BeaconEvent.PAIR_SUCCESS]: {
      handler: defaultEventCallbacks.PAIR_SUCCESS
    }
  }
})
```

- **Alert**: A click outside the alert will now dismiss the alert
- **Logs**: Add warning logs when the QR code gets too big and when muliple Clients are created
- **SigningType**: Add `OPERATION` and `MICHELINE` SigningTypes. The payload of the `OPERATION` type has to start with `03` and the `MICHELINE` type has to start with `05`
- **Beacon Extension**: The "Beacon Extension" has been renamed to "Spire".
- **dApp / Wallet metadata**: The dApp and wallet metadata (name and icon) are now included in the pairing request / response

#### Fixes

- **Matrix Performace Improvements**: Fixed a timing issue that lead to slower responses
- **DAppClient**: `setActiveAccount` now updates and persists the active peer
- **Types**: The type of `matrixNodes` was incorrect
- **Docs**: Fixed a typo in link a docs link

## 2.1.0 (2021-01-22)

#### Features

- **edonet**: Add Edonet
- **carthagenet**: Remove Carthagenet

- **accessibility**: Close alerts with "ESC" button
- **accessibility**: Tab through selection on pairing alert and select item with enter

- **DAppClient**: add `clearActiveAccount()` method. This is just a wrapper for `setActiveAccount()` but should make it more clear how to clear an account.

#### Bug Fixes

- **errors**: Error messages were thrown internally in some cases and could not be caught by the developer
- **broadcast-error**: The "Broadcast" error was mistakenly displayed as a "Network not supported" error
- **init**: If the `init` method was called manually by the developer, the following requests would never resolve
- **pageload**: The transport is now set on pageload even if `init` is not called
- **pageload**: If a peer was connected but no permissions were shared, a refresh will now reconnect to the previous peer
- **deeplink**: Deeplinks on iOS did not work in some browsers
- **pairing**: Center QR code
- **types**: "kind" of the `OriginationOperation` was wrong

## 2.0.1 (2021-01-11)

#### Features

- **pairing:** Add Galleon Desktop Wallet

## 2.0.0 (2020-12-08)

Beacon v2.0.0 is a big update from v1.x. The APIs on the DApp and Wallet side stayed mostly the same. There may be some minor changes in the object structure, but the majority of the changes are internal and should not affect the developers.

We highly encourage developers to upgrade to v2. The most notable new features are:

- Support for multiple Browser Extensions (eg. Thanos and Spire)
- Support for mobile, browser and desktop Wallets
- Mobile support via Deeplinking
- Secure and encrypted communication between DApp and Browser Extension

#### Notable changes

- **all**: changed `beaconId` to `senderId` in all objects
- **senderId**: The senderId property now has to be a hash of the publicKey of the sender
- **P2PTransport**: The pairing-response from the Wallet is no longer only an encrypted public key, but rather an object including the public key (with additional metadata)
- **P2PPairInfo**: Now includes a version and additional metadata
- **P2PPairInfo**: JSON is now `base58check` encoded (eg. QR code)

- **PostMessageTransport**: The communication is now encrypted
- **PostMessageTransport**: `getAvailableExtensions` returns an array of available browser extensions

- **DAppClient**: Having an Extension installed on page load will no longer automatically select that extension as the active peer. The user always has to select his preferred wallet type.

- **Acknowledge Message**: The Wallet will now send an acknowledge message immediately after a request is received.
- **Disconnect Message**: There is now a disconnect even that can be sent from both sides and indicates that the connection will no longer be listened to
- **Error Message**: A new error message type that makes it clear the message is an error

## 1.2.0 (2020-11-13)

#### Features

- **delphinet:** Add delphinet support

## 1.1.1 (2020-08-21)

#### Features

- **build:** Add esmodule files
- **libsodium:** Update to 0.7.8

## 1.1.0 (2020-06-16)

#### Features

- **build:** Add es5 build

## 1.0.5 (2020-06-10)

#### Bug Fixes

- **events:** The `P2P_CHANNEL_CONNECT_SUCCESS` event will now return the `P2PPairInfo` of the newly connected peer.

## 1.0.4 (2020-06-09)

#### Bug Fixes

- **active-account:** calling `await dappClient.getActiveAccount()` will now always wait for the storage to be read, so it will only be undefined if there was actually no active account set before.

## 1.0.3 (2020-06-05)

#### Bug Fixes

- **p2p:** ignore dupliacte messages
- **alert:** fix timeout not working if multiple alerts are open

## 1.0.2 (2020-06-04)

#### Bug Fixes

- **error:** the alert for beacon errors was not displayed

## 1.0.1 (2020-06-04)

#### Bug Fixes

- **operation-request:** use network settings of ActiveAccount by default
- **alert:** multiple alerts can now all be closed independently
- **storage:** update stored information if newer one is available (eg. AccountInfo after a second PermissionRequest)

## 1.0.0 (2020-05-29)

#### Bug Fixes

- **peer:** type of peer methods was `string` instead of `P2PPairInfo`

## 0.7.0 (2020-05-28)

#### Breaking Changes

- **all**: changed `pubkey` and `pubKey` to `publicKey` everywhere
- **events**: added new event type "INTERNAL_ERROR" that will be triggered when an important handled error occurs, for example if `requestOperation` is called but there is no `activeAccount`.
- **account-info / permission-info**: Change `connectedAt` type from `Date` to `number`.
- **all**: due to the changes in the interfaces, the storage of accounts and permissions will be invalid and has to be reset (eg. clearing application cache)

#### Features

- **DAppClient:** when removing peers, remove related accounts as well
- **DAppClient:** when removing an account that happens to be the activeAccount, set activeAccount to null
- **WalletClient:** persist appMetadata and permissions
- **WalletClient:** when removing peers, remove related permissions as well

#### Bug Fixes

- **storage:** clone default values before returning to prevent them from being overwritten

## 0.6.1 (2020-05-22)

#### Bug Fixes

- **storage:** remove FileStorage because it references the "fs" module and can cause issues when used in the brower

## 0.6.0 (2020-05-21)

#### Breaking Changes

- **QR:** fixed a bug where the QR data object was stringified 2 times, resulting in an escaped string

#### Bug Fixes

- **P2P:** show QR Alert again if no peer has connected
- **P2P:** do not throw error when decryption fails, because this is expected to happen sometimes
- **P2P:** fixed error when persisting matrix room, resulting in an error when trying to read rooms from local storage
- **BigNumber:** use BigNumber instead of native BigInt to support Safari

## 0.5.0 (2020-05-15)

#### Internals

- **typescript:** update to 3.9.2
- **typescript:** enable strict mode

#### Bug Fixes

- **account-identifier:** pass Buffer to bs58check encode method

## 0.4.4 (2020-05-14)

#### Breaking Changes

- **p2p-communication-client:** make methods async

## 0.4.3 (2020-05-13)

#### Features

- **alert:** link to correct network

## 0.4.2 (2020-05-13)

#### Features

- **alert:** improve styling and wording

## 0.4.1 (2020-05-12)

#### Bug Fixes

- **alert:** inline beacon logo

## 0.4.0 (2020-05-12)

#### Internals

- **matrix:** replace `matrix-js-sdk` with internal implementation

## 0.3.0 (2020-05-08)

#### Breaking Changes

- **events:** pass overrides in constructor

#### Features

- **alert:** improve styling and wording
- **events:** send success events when receiving a beacon response

#### Bug Fixes

- **get-address-from-pubkey:** handle edpk public keys

## 0.2.0 (2020-04-30)

#### Breaking Changes

- **beacon:** remove read_address permission
- **account-identifier:** remove account identifier from beacon message

#### Features

- **beaconId:** generate keypair and use public key as `beaconId`
- **errors:** add human readable messages

#### Bug Fixes

- **transport:** fix detection of chrome extension

## 0.1.1 (2020-04-29)

#### Internals

- **exposed-promise:** use class instead of function to preserve internal state

#### Bug Fixes

- **active-account:** read active account as early as possible

## 0.1.0 (2020-04-29)

Initial stable beta release
