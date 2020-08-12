# P2P Direct Flow (Direct)

## Init

```mermaid
sequenceDiagram
    dApp->>Wallet: Show QR Code (publicKey exchange)
    Wallet->>Wallet: User scans QR code
    Wallet->>dApp: Send own publicKey to dApp, connection established
```

## Permission Request

```mermaid
sequenceDiagram
    dApp->>Wallet: User Prompt (Do you want to pair?)
    Wallet->>Wallet: Grant permissions
    Wallet->>dApp: Return Address & Permissions
```

## Operation Request

```mermaid
sequenceDiagram
    dApp->>Wallet: Request

    opt no threshold
        Wallet->>Wallet: User confirmation
    end

    Wallet->>Wallet: Forge Operation
    Wallet->>Wallet: Sign
    Wallet->>Wallet: Broadcast

    Wallet->>dApp: Response
```

## Signing Request

```mermaid
sequenceDiagram
    dApp->>Wallet: Request
    opt no threshold
        Wallet->>Wallet: User confirmation
    end
    Wallet->>Wallet: Sign
    Wallet->>dApp: Response
```

| WARNING: Can threshold be abused to sign contract calls? |
| -------------------------------------------------------- |


## Broadcast Request

```mermaid
sequenceDiagram
    dApp->>Wallet: Request

    Wallet->>Wallet: User confirmation
    Wallet->>Wallet: Broadcast

    Wallet->>dApp: Response
```
