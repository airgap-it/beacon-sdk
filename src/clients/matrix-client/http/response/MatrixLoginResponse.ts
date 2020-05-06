import { MatrixResponse } from './MatrixResponse'
import { MatrixLoginRequest } from '../request/MatrixLoginRequest'

export interface MatrixLoginResponse extends MatrixResponse<MatrixLoginRequest> {
  user_id: string
  device_id: string
  access_token: string
}
