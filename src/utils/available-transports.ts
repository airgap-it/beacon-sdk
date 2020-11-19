import { PostMessageTransport } from '../transports/PostMessageTransport'

export interface Extension {
  id: string
  name: string
  iconUrl?: string
}

/**
 * An object with promises to indicate whether or not that transport is available.
 */
export const availableTransports = {
  extension: PostMessageTransport.isAvailable(),
  availableExtensions: PostMessageTransport.getAvailableExtensions()
}
