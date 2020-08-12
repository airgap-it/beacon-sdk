# Ledger Flow

## Init

```mermaid
sequenceDiagram
    Popup->>Background: User Prompt (Pair Ledger)
    Background->>Ledger: Share Account
    Ledger->>Background: Account
    Background->>Popup: Return Account
```

## Permission Request

```mermaid
sequenceDiagram
    dApp->>Background: Request

    Background->>Popup: Permission Prompt
    Popup->>Popup: User Confirmation
    Popup->>Background: Permission Response

    Background->>dApp: Response
```

## Operation Request

```mermaid
sequenceDiagram
    dApp->>Background: Request

    Background->>Popup: Operation Request
    Popup->>Background: Confirm

    Background->>Background: Forge Operation

    Background->>Ledger: Operation Request
    Ledger->>Ledger: User confirmation
    Ledger->>Background: Signed Operation
    Background->>Background: Broadcast

    Background->>dApp: Response
```

## Signing Request

```mermaid
sequenceDiagram
    dApp->>Background: Request

    Background->>Popup: Sign Request
    Popup->>Background: Confirm

    Background->>Ledger: Sign Request
    Ledger->>Ledger: User confirmation
    Ledger->>Background: Signed Operation

    Background->>dApp: Response
```

## Broadcast Request

```mermaid
sequenceDiagram
    dApp->>Background: Request

    Background->>Popup: Broascast Request
    Popup->>Popup: User confirmation
    Popup->>Background: Broascast Response

    Background->>Background: Broadcast

    Background->>dApp: Response
```
