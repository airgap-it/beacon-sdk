import { PostMessageTransport } from '..'

/**
 * An object with promises to indicate whether or not that transport is available.
 */
export const availableTransports = {
  extension: PostMessageTransport.isAvailable(), // TODO: Remove this?
  availableExtensions: PostMessageTransport.getAvailableExtensions()
}
