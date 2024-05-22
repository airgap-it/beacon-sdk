import { EMPTY_ADDRESS } from './header'
import { type BaseMessage } from './messages'

interface V1BaseMessage<T extends string> extends BaseMessage<1> {
  type: T
}

export interface InitMessage extends V1BaseMessage<'init'> {}

export function createInitMessage(
  sender: Uint8Array,
  recipient: Uint8Array = EMPTY_ADDRESS
): InitMessage {
  return {
    version: 1,
    type: 'init',
    sender,
    recipient
  }
}

export interface ChallengeMessage extends V1BaseMessage<'challenge'> {
  challenge: Uint8Array
  difficulty: Uint8Array
}

export function createChallengeMessage(
  recipient: Uint8Array,
  challenge: Uint8Array,
  difficulty: Uint8Array,
  sender: Uint8Array = EMPTY_ADDRESS
): ChallengeMessage {
  return {
    version: 1,
    type: 'challenge',
    sender,
    recipient,
    challenge,
    difficulty
  }
}

export interface ResponseMessage extends V1BaseMessage<'response'> {
  challenge: Uint8Array
  publicKey: Uint8Array
  nonce: Uint8Array
  signature: Uint8Array
}

export function createResponseMessage(
  sender: Uint8Array,
  challenge: Uint8Array,
  publicKey: Uint8Array,
  nonce: Uint8Array,
  signature: Uint8Array,
  recipient: Uint8Array = EMPTY_ADDRESS
): ResponseMessage {
  return {
    version: 1,
    type: 'response',
    sender,
    recipient,
    challenge,
    publicKey,
    nonce,
    signature
  }
}

export interface AcceptedMessage extends V1BaseMessage<'accepted'> {}

export function createAcceptedMessage(
  recipient: Uint8Array,
  sender: Uint8Array = EMPTY_ADDRESS
): AcceptedMessage {
  return {
    version: 1,
    type: 'accepted',
    sender,
    recipient
  }
}

export interface PayloadMessage extends V1BaseMessage<'payload'> {
  payload: Uint8Array
}

export function createPayloadMessage(
  sender: Uint8Array,
  recipient: Uint8Array,
  payload: Uint8Array
): PayloadMessage {
  return {
    version: 1,
    type: 'payload',
    sender,
    recipient,
    payload
  }
}

export type V1Message =
  | InitMessage
  | ChallengeMessage
  | ResponseMessage
  | AcceptedMessage
  | PayloadMessage
  
export const V1MessageCode: Record<V1Message['type'], number> = {
  init: 0x00,
  challenge: 0x01,
  response: 0x02,
  accepted: 0x03,
  payload: 0x04
}
