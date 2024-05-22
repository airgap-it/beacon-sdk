export interface KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export interface Message {
  sender: Uint8Array
  recipient: Uint8Array
  payload: Uint8Array
}

export type MessageListener = (message: Message) => void | Promise<void>