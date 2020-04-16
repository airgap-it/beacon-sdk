# Getting Started (DApp)

## Setup

First, you need to install the `beacon-sdk` package. Because this package is still under heavy development, so expect breaking changes until version `1.0.0` is released.

`npm install --save @airgap/beacon-sdk`

After that you need to import the beacon SDK in your code and initialize the client.

<<< @/src/examples/permission-request.ts

The `beacon-sdk` will automatically try to establish a connection.

If a chrome extension is detected, all requests will be directed to the chrome extension.

If no chrome extension is detected, it will fall back to the beacon-p2p transport layer, which means that a QR code is shown that has to be scanned by a compatible wallet (as of now, there is no wallet that supports this other than a development version of [AirGap Wallet](https://github.com/airgap-it/airgap-wallet/releases/tag/v3.0.3)).

More complex examples can be found [here](/examples/)
