import { MatrixRequest } from './MatrixRequest'

export interface MatrixLoginRequest extends MatrixRequest {
  type: 'm.login.password'
  identifier: {
    type: 'm.id.user'
    user: string
  }
  password: string
  device_id?: string
}
