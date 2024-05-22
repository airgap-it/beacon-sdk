import { type Message } from '../messages'

import { forgeV1Message } from './v1-forger'

export function forgeMessage(message: Message): Buffer {
  switch (message.version) {
    case 1:
      return forgeV1Message(message)
  }
}
