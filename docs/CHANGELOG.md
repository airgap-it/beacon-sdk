# Changelog

## 0.6.0 (unreleased)

#### Bug Fixes

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
