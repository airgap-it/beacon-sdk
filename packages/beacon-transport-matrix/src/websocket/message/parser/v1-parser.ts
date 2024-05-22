import {
  type AcceptedMessage,
  type ChallengeMessage,
  type InitMessage,
  type PayloadMessage,
  type ResponseMessage,
  type V1Message,
  V1MessageCode,
  createChallengeMessage,
  createInitMessage,
  createResponseMessage,
  createAcceptedMessage,
  createPayloadMessage
} from '../v1-messages'
import { extractType, extractVersion } from '../header'

export function parseV1Message(bytes: Uint8Array): V1Message | undefined {
  if (!verifyVersion(bytes)) {
    return undefined
  }

  const type: number | undefined = extractType(bytes)
  if (type === undefined) {
    return undefined
  }

  const sender = bytes.subarray(1, 17)
  const recipient = bytes.subarray(17, 33)
  const payload = bytes.subarray(33)

  switch (type) {
    case V1MessageCode.init:
      return parseInitMessage(sender, recipient)
    case V1MessageCode.challenge:
      return parseChallengeMessage(sender, recipient, payload)
    case V1MessageCode.response:
      return parseResponseMessage(sender, recipient, payload)
    case V1MessageCode.accepted:
      return parseAcceptedMessage(sender, recipient)
    case V1MessageCode.payload:
      return parsePayloadMessage(sender, recipient, payload)
    default:
      return undefined
  }
}

function verifyVersion(bytes: Uint8Array): boolean {
  const version: number | undefined = extractVersion(bytes)

  return version === 1
}

function parseInitMessage(sender: Uint8Array, recipient: Uint8Array): InitMessage {
  return createInitMessage(sender, recipient)
}

function parseChallengeMessage(
  sender: Uint8Array,
  recipient: Uint8Array,
  payload: Uint8Array
): ChallengeMessage {
  const difficulty = payload.subarray(0, 16)
  const challenge = payload.subarray(16)

  return createChallengeMessage(recipient, challenge, difficulty, sender)
}

function parseResponseMessage(sender: Uint8Array, recipient: Uint8Array, payload: Uint8Array): ResponseMessage {
  const challenge = payload.subarray(0, 16)
  const publicKey = payload.subarray(16, 49)
  const nonce = payload.subarray(49, 65)
  const signature = payload.subarray(65)

  return createResponseMessage(sender, challenge, publicKey, nonce, signature, recipient)
}

function parseAcceptedMessage(sender: Uint8Array, recipient: Uint8Array): AcceptedMessage {
  return createAcceptedMessage(recipient, sender)
}

function parsePayloadMessage(sender: Uint8Array, recipient: Uint8Array, payload: Uint8Array): PayloadMessage {
  return createPayloadMessage(sender, recipient, payload)
}
