import { MatrixResponse } from './MatrixResponse'
import { MatrixRoomCreateRequest } from '../api-request/MatrixRoomCreateRequest'

export interface MatrixRoomCreateResponse extends MatrixResponse<MatrixRoomCreateRequest> {
  room_id: string
}
