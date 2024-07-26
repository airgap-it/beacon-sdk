export interface MatrixRoomCreateRequest {
  room_version?: '5'
  visibility?: 'public' | 'private'
  room_alias_name?: string
  name?: string
  topic?: string
  invite?: string[]
  preset?: 'private_chat' | 'public_chat' | 'trusted_private_chat'
  is_direct?: boolean
}

export interface MatrixRoomCreateResponse {
  type?: 'room_create'
  room_id: string
}
