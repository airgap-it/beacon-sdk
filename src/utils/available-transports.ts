import { P2PTransport } from '..'
import { PostMessageTransport } from '../transports/PostMessageTransport'

/**
 * An object with promises to indicate whether or not that transport is available.
 */
export const availableTransports = {
  extension: PostMessageTransport.isAvailable(),
  p2p: P2PTransport.isAvailable()
}
