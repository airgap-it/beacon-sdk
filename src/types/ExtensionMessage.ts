import { ExtensionMessageTarget } from '..'

export interface ExtensionMessage<T> {
  target: ExtensionMessageTarget
  payload: T
}
