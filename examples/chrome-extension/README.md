# Beacon Wallet Chrome Extension

A sample Chrome extension wallet that demonstrates Beacon SDK integration for Tezos dApps.

> **Warning: Not Production Ready**
>
> This extension is a **development example only**. It lacks critical security features required for a production wallet:
> - No storage encryption - private keys are stored in plain text in Chrome's local storage
> - No secure key management or hardware wallet support
> - No password protection or session locking
> - Minimal input validation and error handling
>
> **Do not use with real funds.** This is intended as a reference implementation for Beacon protocol interaction.

## Reference Implementation

This extension serves as a reference for how to interact with the Beacon protocol from a Chrome extension wallet. It demonstrates:

- **Message handling**: How to receive and parse Beacon messages via PostMessage transport
- **Request flow**: Processing permission, signing, and operation requests
- **Response format**: Constructing proper Beacon protocol responses
- **UI patterns**: Presenting approval dialogs to users

### Architecture

The extension cleanly separates Beacon protocol handling from wallet signing logic through the `WalletProvider` interface:

```typescript
interface WalletProvider {
  isReady(): boolean
  getWalletInfo(): WalletInfo | null
  signPayload(payload: string, signingType: 'raw' | 'operation' | 'micheline'): Promise<SignPayloadResult>
  signOperation(operations: TezosOperation[], network: NetworkConfig): Promise<SignOperationResult>
}
```

This interface defines what the Beacon layer needs from a wallet implementation. See `src/wallet/WalletProvider.ts` for full documentation and `src/wallet/TaquitoProvider.ts` for a sample implementation.

## Features

- Generate new wallet or import via mnemonic/private key
- Connect to Tezos dApps using Beacon protocol
- Approve/reject permission, signing, and operation requests
- Network switching (Mainnet, Ghostnet, etc.)
- View balance and open block explorer

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch mode for development
npm run watch
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

## Project Structure

```
src/
├── background/       # Service worker - handles Beacon messages
├── content/          # Content script - bridges page and extension
├── popup/            # Extension popup UI
│   ├── components/   # Reusable components (ApprovalModal)
│   └── pages/        # Main views (Setup, Main)
├── beacon/           # Beacon types and message formatting
├── shared/           # Shared utilities (networks)
└── wallet/           # Wallet logic (WalletProvider interface, TaquitoProvider)
```

## Usage

1. Click the extension icon to open the popup
2. Generate a new wallet or import an existing one
3. Visit a Tezos dApp that uses Beacon
4. Approve the connection request in the extension popup
5. Sign transactions when prompted
