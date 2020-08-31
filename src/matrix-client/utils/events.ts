import { MatrixStateEvent, MatrixStateEventMessageText } from '../models/MatrixStateEvent'
import { MatrixMessageType } from '../models/MatrixMessage'

/**
 * Check if an event is a create event
 *
 * @param event MatrixStateEvent
 */
export function isCreateEvent(event: MatrixStateEvent): boolean {
  return (
    event.type === 'm.room.create' && event.content instanceof Object && 'creator' in event.content
  )
}

/**
 * Check if an event is a join event
 *
 * @param event MatrixStateEvent
 */
export function isJoinEvent(event: MatrixStateEvent): boolean {
  return (
    event.type === 'm.room.member' &&
    event.content instanceof Object &&
    'membership' in event.content &&
    // eslint-disable-next-line dot-notation
    event.content['membership'] === 'join'
  )
}

/**
 * Check if an event is a message event
 *
 * @param event MatrixStateEvent
 */
export function isMessageEvent(event: MatrixStateEvent): boolean {
  return event.type === 'm.room.message'
}

/**
 * Check if an event is a text message event
 *
 * @param event MatrixStateEvent
 */
export function isTextMessageEvent(event: MatrixStateEvent): event is MatrixStateEventMessageText {
  return (
    isMessageEvent(event) &&
    event.content instanceof Object &&
    'msgtype' in event.content &&
    // eslint-disable-next-line dot-notation
    event.content['msgtype'] === MatrixMessageType.TEXT
  )
}
