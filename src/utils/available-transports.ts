import { PostMessageTransport } from '..'

/**
 * An object with promises to indicate whether or not that transport is available.
 */
export const availableTransports = {
  availableExtensions: PostMessageTransport.getAvailableExtensions()
}
