import { MatrixRequest } from './MatrixRequest'

export interface MatrixRoomInviteRequest extends MatrixRequest {
  user_id: string
}
