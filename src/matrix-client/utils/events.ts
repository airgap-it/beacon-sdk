import { MatrixStateEvent, MatrixStateEventMessageText } from '../models/MatrixStateEvent'
import { MatrixMessageType } from '../models/MatrixMessage'

export function isCreateEvent(event: MatrixStateEvent): boolean {
  return (
    event.type === 'm.room.create' && event.content instanceof Object && 'creator' in event.content
  )
}

export function isJoinEvent(event: MatrixStateEvent): boolean {
  return (
    event.type === 'm.room.member' &&
    event.content instanceof Object &&
    'membership' in event.content &&
    // eslint-disable-next-line dot-notation
    event.content['membership'] === 'join'
  )
}

export function isMessageEvent(event: MatrixStateEvent): boolean {
  return event.type === 'm.room.message'
}

export function isTextMessageEvent(event: MatrixStateEvent): event is MatrixStateEventMessageText {
  return (
    isMessageEvent(event) &&
    event.content instanceof Object &&
    'msgtype' in event.content &&
    // eslint-disable-next-line dot-notation
    event.content['msgtype'] === MatrixMessageType.TEXT
  )
}
