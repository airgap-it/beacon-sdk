import { ExtensionMessageTarget } from '..'

/**
 * @internalapi
 */
export interface ExtensionMessage<T, U = unknown> {
  target: ExtensionMessageTarget
  targetId?: string
  sender?: U
  payload: T
}

/**
 * @internalapi
 */
export interface EncryptedExtensionMessage<U = unknown> {
  target: ExtensionMessageTarget
  targetId?: string
  sender?: U
  encryptedPayload: string
}
