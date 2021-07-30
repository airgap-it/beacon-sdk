import { MatrixHttpClient } from '../MatrixHttpClient'

import { MatrixEventSendResponse } from '../models/api/MatrixEventSend'
import { MatrixSyncResponse } from '../models/api/MatrixSync'
import { MatrixStateEventMessageContent } from '../models/MatrixStateEvent'

interface MatrixScheduledEvent<T> {
  accessToken: string
  roomId: string
  type: MatrixEventType
  content: any
  txnId: string
  onSuccess(response: T): void
  onError(error: unknown): void
}

type MatrixEventType = 'm.room.message'

type CacheKeys = 'sync'

export interface MatrixSyncOptions {
  syncToken?: string
  pollingTimeout?: number
}

/**
 * A service to help with matrix event management
 */
export class MatrixEventService {
  private readonly cachedPromises: Map<CacheKeys, Promise<any>> = new Map()

  constructor(private readonly httpClient: MatrixHttpClient) {}

  /**
   * Get the latest state from the matrix node
   *
   * @param accessToken
   * @param options
   */
  public async sync(accessToken: string, options?: MatrixSyncOptions): Promise<MatrixSyncResponse> {
    return this.withCache('sync', () =>
      this.httpClient.get<MatrixSyncResponse>(
        '/sync',
        {
          timeout: options ? options.pollingTimeout : undefined,
          since: options ? options.syncToken : undefined
        },
        { accessToken }
      )
    )
  }

  /**
   * Send a message to a room
   *
   * @param accessToken
   * @param room
   * @param content
   * @param txnId
   */
  public async sendMessage(
    accessToken: string,
    roomId: string,
    content: MatrixStateEventMessageContent,
    txnId: string
  ): Promise<MatrixEventSendResponse> {
    return new Promise((resolve, reject) =>
      this.scheduleEvent({
        accessToken,
        roomId,
        type: 'm.room.message',
        content,
        txnId,
        onSuccess: resolve,
        onError: reject
      })
    )
  }

  /**
   * Schedules an event to be sent to the node
   *
   * @param event
   */
  public scheduleEvent(event: MatrixScheduledEvent<any>) {
    // TODO: actual scheduling
    this.sendEvent(event)
  }

  /**
   * Send an event to the matrix node
   *
   * @param scheduledEvent
   */
  public async sendEvent(scheduledEvent: MatrixScheduledEvent<any>): Promise<void> {
    const { roomId, type, txnId, content, accessToken } = scheduledEvent

    try {
      const response = await this.httpClient.put<MatrixEventSendResponse>(
        `/rooms/${encodeURIComponent(roomId)}/send/${type}/${encodeURIComponent(txnId)}`,
        content,
        { accessToken }
      )
      scheduledEvent.onSuccess(response)
    } catch (error) {
      scheduledEvent.onError(error)
    }
  }

  /**
   * Check the cache when interacting with the Matrix node, if there is an already ongoing call for the specified key, return its promise instead of duplicating the call.
   *
   * @param key
   * @param promiseProvider
   */
  private withCache<T>(key: CacheKeys, promiseProvider: () => Promise<T>): Promise<T> {
    let promise = this.cachedPromises.get(key)

    if (!promise) {
      promise = promiseProvider().finally(() => {
        this.cachedPromises.delete(key)
      })
      this.cachedPromises.set(key, promise)
    }

    return promise
  }
}
