import { MatrixResponse } from './MatrixResponse'
import { MatrixEventSendRequest } from '../api-request/MatrixEventSendRequest'

export interface MatrixEventSendResponse extends MatrixResponse<MatrixEventSendRequest<any>> {
  event_id: string
}
