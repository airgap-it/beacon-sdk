import { MatrixRequest } from './MatrixRequest'

export interface MatrixRoomCreateRequest extends MatrixRequest {
  visibility?: 'public' | 'private'
  room_alias_name?: string
  name?: string
  topic?: string
  invite?: string[]
  preset?: 'private_chat' | 'public_chat' | 'trusted_private_chat'
  is_direct?: boolean
}
