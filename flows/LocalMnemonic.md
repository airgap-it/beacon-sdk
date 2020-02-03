

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
    opt threshold
        Background->>Background: Operation Request
        Note left of Background: Only spend<br/>No contract calls
    end
    opt no threshold
        Background->>Popup: Operation Request
        Popup->>Popup: User confirmation
        Popup->>Background: Operation Response
    end
    Background->>dApp: Response
```

## Signing Request

```mermaid
sequenceDiagram
    dApp->>Background: Request
    opt threshold
        Background->>Background: Signing Request
        Note left of Background: Only spend<br/>No contract calls
    end
    opt no threshold
        Background->>Popup: Signing Request
        Popup->>Popup: User confirmation
        Popup->>Background: Signing Response
    end
    Background->>dApp: Response
```

| WARNING: Can threshold be abused to sign contract calls? |
| --- |

## Broadcast Request

```mermaid
sequenceDiagram
    dApp->>Background: Request

    Background->>Popup: Signing Request
    Popup->>Popup: User confirmation
    Popup->>Background: Signing Response

    Background->>dApp: Response
```