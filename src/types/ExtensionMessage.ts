export enum ExtensionMessageTarget {
  BACKGROUND = 'toBackground',
  PAGE = 'toPage',
  EXTENSION = 'toExtension'
}

export interface ExtensionMessage<T> {
  target: ExtensionMessageTarget
  payload: T
}
