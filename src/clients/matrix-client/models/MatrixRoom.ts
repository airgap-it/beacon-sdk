import {
  MatrixSyncJoinedRoom,
  MatrixSyncInvitedRoom,
  MatrixSyncLeftRoom,
  MatrixSyncRooms
} from './api/MatrixSync'
import { MatrixMessage } from './MatrixMessage'
import { isCreateEvent, isJoinEvent, isMessageEvent } from '../utils/events'
import { MatrixStateEvent } from './MatrixStateEvent'

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
        ? new MatrixRoom(roomOrId.id, status, roomOrId.members, roomOrId.messages)
        : roomOrId
      : new MatrixRoom(roomOrId, status || MatrixRoomStatus.UNKNOWN)
  }

  private static fromJoined(id: string, joined: MatrixSyncJoinedRoom): MatrixRoom {
    const events = [...joined.state.events, ...joined.timeline.events]
    const members = MatrixRoom.getMembersFromEvents(events)
    const messages = MatrixRoom.getMessagesFromEvents(events)

    return new MatrixRoom(id, MatrixRoomStatus.JOINED, members, messages)
  }

  private static fromInvited(id: string, invited: MatrixSyncInvitedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents(invited.events)

    return new MatrixRoom(id, MatrixRoomStatus.INVITED, members)
  }

  private static fromLeft(id: string, left: MatrixSyncLeftRoom): MatrixRoom {
    const events = [...left.state.events, ...left.timeline.events]
    const members = MatrixRoom.getMembersFromEvents(events)
    const messages = MatrixRoom.getMessagesFromEvents(events)

    return new MatrixRoom(id, MatrixRoomStatus.LEFT, members, messages)
  }

  private static getMembersFromEvents(events: MatrixStateEvent[]): string[] {
    return events
      .filter((event) => isCreateEvent(event) || isJoinEvent(event))
      .map((event) => event.sender)
      .filter((member, index, array) => array.indexOf(member) === index)
  }

  private static getMessagesFromEvents(events: MatrixStateEvent[]): MatrixMessage<any>[] {
    return events
      .filter((event) => isMessageEvent(event))
      .map((event) => MatrixMessage.from(event))
      .filter((message) => !!message) as MatrixMessage<any>[]
  }

  constructor(
    readonly id: string,
    readonly status: MatrixRoomStatus = MatrixRoomStatus.UNKNOWN,
    readonly members: string[] = [],
    readonly messages: MatrixMessage<any>[] = []
  ) {}
}
