import {
  MatrixSyncJoinedRoom,
  MatrixSyncInvitedRoom,
  MatrixSyncLeftRoom,
  MatrixSyncRoomStateEvent,
  MatrixSyncRooms
} from './api/MatrixSync'

export enum MatrixRoomStatus {
  UNKNOWN,
  JOINED,
  INVITED,
  LEFT
}

export class MatrixRoom {
  public static fromSync(roomSync: MatrixSyncRooms): MatrixRoom[] {
    function create<T>(
      rooms: { [key: string]: T },
      creator: (id: string, room: T) => MatrixRoom
    ): MatrixRoom[] {
      return Object.entries(rooms).map(([id, room]) => creator(id, room))
    }

    return [
      ...create(roomSync.join, MatrixRoom.fromJoined),
      ...create(roomSync.invite, MatrixRoom.fromInvited),
      ...create(roomSync.leave, MatrixRoom.fromLeft)
    ]
  }

  public static from(roomOrId: string | MatrixRoom, status?: MatrixRoomStatus): MatrixRoom {
    return roomOrId instanceof MatrixRoom
      ? status
        ? new MatrixRoom(roomOrId.id, status, roomOrId.members)
        : roomOrId
      : new MatrixRoom(roomOrId, status || MatrixRoomStatus.UNKNOWN, [])
  }

  private static fromJoined(id: string, joined: MatrixSyncJoinedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents([
      ...joined.state.events,
      ...joined.timeline.events
    ])

    return new MatrixRoom(id, MatrixRoomStatus.JOINED, members)
  }

  private static fromInvited(id: string, invited: MatrixSyncInvitedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents(invited.events)

    return new MatrixRoom(id, MatrixRoomStatus.INVITED, members)
  }

  private static fromLeft(id: string, left: MatrixSyncLeftRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents([...left.state.events, ...left.timeline.events])

    return new MatrixRoom(id, MatrixRoomStatus.LEFT, members)
  }

  private static getMembersFromEvents(events: MatrixSyncRoomStateEvent[]): string[] {
    function isCreateEvent(event: MatrixSyncRoomStateEvent): boolean {
      return event.type === 'm.room.create' && 'creator' in event.content
    }

    function isJoinEvent(event: MatrixSyncRoomStateEvent): boolean {
      return (
        event.type === 'm.room.member' &&
        event.content.membership &&
        event.content.membership === 'join'
      )
    }

    return events
      .filter((event) => isCreateEvent(event) || isJoinEvent(event))
      .map((event) => event.sender)
      .filter((member, index, array) => array.indexOf(member) === index)
  }

  constructor(readonly id: string, readonly status: MatrixRoomStatus, readonly members: string[]) {}
}
