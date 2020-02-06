```mermaid
graph LR
    A[dApp] --> B[P2P]
    A[dApp] --> C[Extension]
    C --> D{Proxy}
    C --> E{Signers}
    D --> F[P2P]
    E --> G[Ledger]
    D --> H[Deeplink]
    E --> I[Local Mnemonic]
```

The different flows are defined in the flows folder.
