import { ExtensionMessageTarget } from '..'

export interface ExtensionMessage<T, U = unknown> {
  target: ExtensionMessageTarget
  sender?: U
  payload: T
}

export interface EncryptedExtensionMessage<U = unknown> {
  target: ExtensionMessageTarget
  sender?: U
  encryptedPayload: string
}
