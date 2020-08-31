import { PostMessageTransport } from '../transports/PostMessageTransport'

/**
 * A global promise that resolves with true if a browser extension is installed, or resolves with false after 200ms if not.
 */
export const isExtensionInstalled = PostMessageTransport.isAvailable()
