import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import {
  MatrixEventSendRequest,
  MatrixEventMessageContent
} from '../models/api-request/MatrixEventSendRequest'
import { MatrixEventSendResponse } from '../models/api-response/MatrixEventSendResponse'

type MatrixEventType = 'm.room.message'

export class MatrixEventService {
  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async sendMessage(
    accessToken: string,
    room: MatrixRoom,
    content: MatrixEventMessageContent,
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

    return this.httpClient.put<MatrixEventSendRequest<any>, MatrixEventSendResponse>(
      `/rooms/${room.id}/send/${type}/${txnId}`,
      { content },
      { accessToken }
    )
  }
}
