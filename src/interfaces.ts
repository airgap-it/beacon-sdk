import { PermissionScope } from './types/Messages'

export interface MatrixEvent {
  getSender(): string
  getContent(): { body: string }
  getType(): string
}

export interface MatrixCreateRoom {
  invite: string[]
  preset: string
  // eslint-disable-next-line camelcase
  is_direct: boolean
}

export interface MatrixClient {
  getRooms(): Room[]
  createRoom(room: MatrixCreateRoom): Promise<Room>
  getRoom(roomId: string): Room
  sendMessage(
    roomId: string,
    message: {
      msgtype: string
      body: string
    }
  ): void
  on(eventName: string, eventCallback: (event: MatrixEvent) => void): void
  removeListener(event: string, callback: unknown): void
  removeAllListeners(event: string): void
}

export interface Member {
  membership: string
  roomId: string
  userId: string
}

export interface Room {
  roomId: string
  // eslint-disable-next-line camelcase
  room_id: string
  currentState: {
    getMembers(): Member[]
  }
}

export interface ICommunicationPair {
  name: string
  pubKey: string
  relayServer: string
}

export interface Permission {
  pubkey: string
  networks: string[]
  scopes: PermissionScope[]
}
