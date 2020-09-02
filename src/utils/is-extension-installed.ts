import { PostMessageTransport } from '../transports/PostMessageTransport'

/**
 * An object with promises to indicate whether or not that transport is available.
 */
export const availableTransports = { extension: PostMessageTransport.isAvailable() }
