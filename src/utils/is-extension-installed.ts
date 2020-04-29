import { PostMessageTransport } from "../transports/PostMessageTransport"

export const isChromeExtensionInstalled = PostMessageTransport.isAvailable()
