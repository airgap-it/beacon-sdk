import { MatrixRequest } from '../api-request/MatrixRequest'

export interface MatrixResponse<T extends MatrixRequest> {
  _typeGuard?: keyof T
}
