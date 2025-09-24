import { DEFAULT_MESSAGE_PROTOCOL_VERSION } from './constants'

let preferredMessageProtocolVersion: number = DEFAULT_MESSAGE_PROTOCOL_VERSION

export const getPreferredMessageProtocolVersion = (): number => preferredMessageProtocolVersion

export const setPreferredMessageProtocolVersion = (version: number): void => {
  preferredMessageProtocolVersion = version
}
