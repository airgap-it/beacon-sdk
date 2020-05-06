import { MatrixResponse } from './MatrixResponse'
import { MatrixRoomJoinRequest } from '../api-request/MatrixRoomJoinRequest'

export interface MatrixRoomJoinResponse extends MatrixResponse<MatrixRoomJoinRequest> {
  room_id: string
}
