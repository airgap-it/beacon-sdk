import { MatrixResponse } from './MatrixResponse'
import { MatrixRoomJoinRequest } from '../request/MatrixRoomJoinRequest'

export interface MatrixRoomJoinResponse extends MatrixResponse<MatrixRoomJoinRequest> {
  room_id: string
}
