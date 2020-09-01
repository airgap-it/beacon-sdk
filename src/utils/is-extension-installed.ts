import { PostMessageTransport } from '../transports/PostMessageTransport'

export const availableTransports = { extension: PostMessageTransport.isAvailable() }
