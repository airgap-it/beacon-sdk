# Changelog

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
