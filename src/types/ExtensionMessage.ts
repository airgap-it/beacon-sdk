import { ExtensionMessageTarget } from '..'

export interface ExtensionMessage<T, U = unknown> {
  target: ExtensionMessageTarget
  targetId?: string
  sender?: U
  payload: T
}

export interface EncryptedExtensionMessage<U = unknown> {
  target: ExtensionMessageTarget
  targetId?: string
  sender?: U
  encryptedPayload: string
}
