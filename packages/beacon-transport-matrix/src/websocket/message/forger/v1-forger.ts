import { createHeader } from '../header'
import {
  type AcceptedMessage,
  type ChallengeMessage,
  type InitMessage,
  type PayloadMessage,
  type ResponseMessage,
  type V1Message,
  V1MessageCode
} from '../v1-messages'

export function forgeV1Message(message: V1Message): Buffer {
  const header: Buffer = createHeader(
    message.version,
    V1MessageCode[message.type],
    message.sender,
    message.recipient
  )
  const payload: Buffer = forgeV1MessagePayload(message)

  return Buffer.concat([header, payload])
}

function forgeV1MessagePayload(message: V1Message): Buffer {
  switch (message.type) {
    case 'init':
      return forgeInitMessagePayload(message)
    case 'challenge':
      return forgeChallengeMessagePayload(message)
    case 'response':
      return forgeResponseMessagePayload(message)
    case 'accepted':
      return forgeAcceptedMessagePayload(message)
    case 'payload':
      return forgePayloadMessagePayload(message)
  }
}

function forgeInitMessagePayload(_message: InitMessage): Buffer {
  return Buffer.alloc(0)
}

function forgeChallengeMessagePayload(message: ChallengeMessage): Buffer {
  return Buffer.concat([message.difficulty, message.challenge])
}

function forgeResponseMessagePayload(message: ResponseMessage): Buffer {
  return Buffer.concat([message.challenge, message.publicKey, message.nonce, message.signature])
}

function forgeAcceptedMessagePayload(_message: AcceptedMessage): Buffer {
  return Buffer.alloc(0)
}

function forgePayloadMessagePayload(message: PayloadMessage): Buffer {
  return Buffer.from(message.payload)
}
