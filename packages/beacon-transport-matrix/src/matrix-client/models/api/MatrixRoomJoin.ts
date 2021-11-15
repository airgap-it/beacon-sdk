export interface MatrixRoomJoinRequest {}

export interface MatrixRoomJoinResponse {
  type?: 'room_join'
  room_id: string
}
