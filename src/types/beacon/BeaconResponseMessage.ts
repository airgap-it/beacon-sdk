import {
  PermissionResponse,
  OperationResponse,
  SignPayloadResponse,
  BroadcastResponse
} from '../..'
import { ErrorResponse } from './messages/ErrorResponse'

export type BeaconResponseMessage =
  | PermissionResponse
  | OperationResponse
  | SignPayloadResponse
  | BroadcastResponse
  | ErrorResponse
