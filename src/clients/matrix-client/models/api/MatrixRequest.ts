import { MatrixLoginRequest, MatrixLoginResponse } from './MatrixLogin'
import { MatrixRoomCreateRequest, MatrixRoomCreateResponse } from './MatrixRoomCreate'
import { MatrixRoomInviteRequest, MatrixRoomInviteResponse } from './MatrixRoomInvite'
import { MatrixRoomJoinRequest, MatrixRoomJoinResponse } from './MatrixRoomJoin'
import { MatrixEventSendRequest, MatrixEventSendResponse } from './MatrixEventSend'
import { MatrixSyncResponse } from './MatrixSync'

export type MatrixRequest<T> = T extends MatrixLoginResponse
  ? MatrixLoginRequest
  : T extends MatrixRoomCreateResponse
  ? MatrixRoomCreateRequest
  : T extends MatrixRoomInviteResponse
  ? MatrixRoomInviteRequest
  : T extends MatrixRoomJoinResponse
  ? MatrixRoomJoinRequest
  : T extends MatrixEventSendResponse
  ? MatrixEventSendRequest<any>
  : T extends MatrixSyncResponse
  ? never
  : never
