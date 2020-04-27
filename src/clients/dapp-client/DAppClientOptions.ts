import { Storage } from '../..'
import { InternalEvent, InternalEventHandlerFunction } from '../../events'

export interface DAppClientOptions {
  name: string
  iconUrl?: string
  storage?: Storage
  eventHandlers?: {
    [key in InternalEvent]: {
      handler: InternalEventHandlerFunction
    }
  }
}
