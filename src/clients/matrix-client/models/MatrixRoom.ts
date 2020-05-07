import {
  MatrixSyncJoinedRoom,
  MatrixSyncInvitedRoom,
  MatrixSyncLeftRoom,
  MatrixSyncRoomStateEvent
} from './api/MatrixSync'

export enum MatrixRoomStatus {
  UNKNOWN,
  JOINED,
  INVITED,
  LEFT
}

export class MatrixRoom {
  public static from(roomOrId: string | MatrixRoom, status?: MatrixRoomStatus): MatrixRoom {
    return roomOrId instanceof MatrixRoom
      ? status
        ? new MatrixRoom(roomOrId.id, status, roomOrId.members)
        : roomOrId
      : new MatrixRoom(roomOrId, status || MatrixRoomStatus.UNKNOWN, [])
  }

  public static fromJoined(id: string, joined: MatrixSyncJoinedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents([
      ...joined.state.events,
      ...joined.timeline.events
    ])

    return new MatrixRoom(id, MatrixRoomStatus.JOINED, members)
  }

  public static fromInvited(id: string, invited: MatrixSyncInvitedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents(invited.events)

    return new MatrixRoom(id, MatrixRoomStatus.INVITED, members)
  }

  public static fromLeft(id: string, left: MatrixSyncLeftRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents([...left.state.events, ...left.timeline.events])

    return new MatrixRoom(id, MatrixRoomStatus.LEFT, members)
  }

  public static update(oldRoom: MatrixRoom, newRoom: MatrixRoom): MatrixRoom {
    return new MatrixRoom(
      newRoom.id,
      newRoom.status,
      [...oldRoom.members, ...newRoom.members].filter(
        (member, index, array) => array.indexOf(member) === index
      )
    )
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
