import { MatrixRequest } from '../request/MatrixRequest'

export interface MatrixResponse<T extends MatrixRequest> {
  _typeGuard?: keyof T
}
