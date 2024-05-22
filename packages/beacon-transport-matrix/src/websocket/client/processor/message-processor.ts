import { type Message } from '../../message/messages'
import { type KeyPair, type Message as ClientMessage } from '../types'

interface BaseProcessorAction<T extends string> {
  type: T
}

export interface ConnectedProcessorAction extends BaseProcessorAction<'connected'> {}

export interface SendProcessorAction extends BaseProcessorAction<'send'> {
  message: Message
}

export interface NotifyProcessorAction extends BaseProcessorAction<'notify'> {
  message: ClientMessage
}

export type ProcessorAction = ConnectedProcessorAction | SendProcessorAction | NotifyProcessorAction

export interface MessageProcessor {
  init(): Promise<ProcessorAction | undefined>
  processMessage(message: Message, keyPair: KeyPair): Promise<ProcessorAction | undefined>
  prepareMessage(recipient: Uint8Array, payload: Uint8Array): Promise<Message>
}