# `@airgap/beacon-wallet`

This package is part of the `@airgap/beacon-sdk` project. [Read more](https://github.com/airgap-it/beacon-sdk)

## Introduction

Use this package in your wallet to instanciate a `WalletClient` object and communicate to dApps.

## Usage

```typescript
import { WalletClient } from '@airgap/beacon-wallet'

const walletClient = new WalletClient({ name: "Example Wallet" });
await walletClient.init();
walletClient.connect((message) => {
  // Handle incoming messages from dApps
});
```

Check our documentation for more information. [Documentation](https://docs.walletbeacon.io)

## Lifecycle Management (Important for Extensions)

The WalletClient maintains a persistent connection to Matrix relay servers via long-polling. Once `connect()` is called, the client polls the server every 30 seconds to receive messages from dApps.

**For regular web pages**, this is fine because closing the page naturally terminates the connection.

**For browser extensions**, this requires careful lifecycle management because background scripts persist indefinitely. Without proper management, your extension will continuously poll servers even when idle, wasting bandwidth and resources.

### Recommended Pattern

- **No peers** = Don't connect (nothing to poll for)
- **Has peers** = Connect to receive messages
- **New pairing request** = Connect on-demand

See the [Chrome Extension Example](../../examples/chrome-extension/) for a complete reference implementation demonstrating:
- Conditional initialization (only connect when peers exist)
- Lazy initialization (connect on-demand for new pairings)
- Proper cleanup with `destroy()`
