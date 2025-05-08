import { Origin } from "./Origin";


/**
 * @internalapi
 */
export interface ConnectionContext {
  origin: Origin
  id: string
  extras?: { sender: chrome.runtime.MessageSender; sendResponse(response?: unknown): void }
}
