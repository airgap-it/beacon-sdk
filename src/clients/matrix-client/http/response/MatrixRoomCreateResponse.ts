import { MatrixResponse } from './MatrixResponse'
import { MatrixRoomCreateRequest } from '../request/MatrixRoomCreateRequest'

export interface MatrixRoomCreateResponse extends MatrixResponse<MatrixRoomCreateRequest> {
  room_id: string
}
