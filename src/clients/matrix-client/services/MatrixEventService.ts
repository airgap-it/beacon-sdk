import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import { MatrixEventSendResponse } from '../models/api/MatrixEventSend'
import { MatrixSyncResponse } from '../models/api/MatrixSync'
import { MatrixStateEventMessageContent } from '../models/MatrixStateEvent'

type MatrixEventType = 'm.room.message'

export interface MatrixSyncOptions {
  syncToken?: string
  pollingTimeout?: number
}

export class MatrixEventService {
  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async sync(accessToken: string, options?: MatrixSyncOptions): Promise<MatrixSyncResponse> {
    return this.httpClient.get<MatrixSyncResponse>(
      '/sync',
      {
        timeout: options?.pollingTimeout,
        since: options?.syncToken
      },
      { accessToken }
    )
  }

  public async sendMessage(
    accessToken: string,
    room: MatrixRoom,
    content: MatrixStateEventMessageContent,
    txnId: string
  ): Promise<MatrixEventSendResponse> {
    return this.sendEvent(accessToken, room, 'm.room.message', content, txnId)
  }

  public async sendEvent(
    accessToken: string,
    room: MatrixRoom,
    type: MatrixEventType,
    content: any,
    txnId: string
  ): Promise<MatrixEventSendResponse> {
    if (room.status !== MatrixRoomStatus.JOINED && room.status !== MatrixRoomStatus.UNKNOWN) {
      return Promise.reject(`User is not a member of room ${room.id}.`)
    }

    return this.httpClient.put(
      `/rooms/${room.id}/send/${type}/${txnId}`,
      { content },
      { accessToken }
    )
  }
}
