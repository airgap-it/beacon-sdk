# Local Mnemonic Flow

## Init

```mermaid
sequenceDiagram
    Popup->>Popup: User Prompt (Add/Generate Mnemonic?)
    Popup->>Background: Save Mnemonic
    alt generate
        Popup->>Background: New / Save mnemonic
        Background->>Background: Generate new Mnemonic
    end
    Background->>Popup: Return Mnemonic
```

## Permission Request

```mermaid
sequenceDiagram
    dApp->>Background: Request
    Background->>Popup: Permission Request
    Popup->>Popup: User confirmation
    Popup->>Background: Permission Response
    Background->>dApp: Response
```

## Operation Request

```mermaid
sequenceDiagram
    dApp->>Background: Request
    Background->>Background: Fetch operation data
    opt no threshold
        Note left of Background: Everything except<br/>simple spend has<br/>to be approved
        Background->>Popup: Operation Request
        Popup->>Popup: User confirmation
        Popup->>Background: Operation Response
    end

    Background->>Background: Forge Operation
    Background->>Background: Sign Operation
    Background->>Background: Broadcast

    Background->>dApp: Response
```

## Signing Request

```mermaid
sequenceDiagram
    dApp->>Background: Request
    opt no threshold
        Note left of Background: Everything except<br/>simple spend has<br/>to be approved
        Background->>Popup: Signing Request
        Popup->>Popup: User confirmation
        Popup->>Background: Signing Response
    end

    Background->>Background: Sign Operation

    Background->>dApp: Response
```

| WARNING: Can threshold be abused to sign contract calls? |
| -------------------------------------------------------- |


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
