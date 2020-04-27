import { ExtensionMessageTarget } from '..'

export interface ExtensionMessage<T, U = unknown> {
  target: ExtensionMessageTarget
  sender?: U
  payload: T
}
