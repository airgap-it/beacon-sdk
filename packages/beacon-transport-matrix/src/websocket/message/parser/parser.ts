import { type Message } from '../messages'

import { extractVersion } from '../header'
import { parseV1Message } from './v1-parser'

export function parseMessage(bytes: Uint8Array): Message | undefined {
  const version: number | undefined = extractVersion(bytes)
  if (version === undefined) {
    return undefined
  }

  switch (version) {
    case 1:
      return parseV1Message(bytes)
    default:
      return undefined
  }
}
