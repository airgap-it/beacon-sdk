import { BeaconMessageType } from '@airgap/beacon-types'
import { Logger } from './Logger'

type BCMessageType =
  | 'REQUEST_LEADERSHIP'
  | 'LEADER_EXISTS'
  | 'LEADER_UNLOAD'
  | 'LEADER_STILL_ALIVE'
  | 'IS_LEADER_ALIVE'
  | 'CHILD_UNLOAD'
  | 'CHILD_STILL_ALIVE'
  | 'IS_CHILD_ALIVE'
  | 'RESPONSE'
  | 'DISCONNECT'
  | 'REQUEST_PAIRING'
  | 'RESPONSE_PAIRING'
  | 'HIDE_UI'
  | 'NEW_PEER'
  | 'GET_PERMISSIONS'
  | BeaconMessageType

type BCMessage = {
  type: BCMessageType
  sender: string
  recipient?: string
  data?: any
}

const timeout = 1000 // ms
const logger = new Logger('MultiTabChannel')

export class MultiTabChannel {
  private id: string = String(Date.now())
  private neighborhood: Set<string> = new Set()
  private channel: BroadcastChannel
  private eventListeners = [
    () => this.onBeforeUnloadHandler(),
    (message: any) => this.onMessageHandler(message)
  ]
  private onBCMessageHandler: Function
  private onElectedLeaderHandler: Function
  private leaderElectionTimeout: NodeJS.Timeout | undefined
  private pendingACKs: Map<string, NodeJS.Timeout> = new Map()

  isLeader: boolean = false

  private messageHandlers: {
    [key in BCMessageType]?: (data: BCMessage) => void
  } = {
    REQUEST_LEADERSHIP: this.handleRequestLeadership.bind(this),
    LEADER_EXISTS: this.handleLeaderExists.bind(this),
    CHILD_UNLOAD: this.handleChildUnload.bind(this),
    CHILD_STILL_ALIVE: this.handleChildStillAlive.bind(this),
    IS_CHILD_ALIVE: this.handleIsChildAlive.bind(this),
    LEADER_UNLOAD: this.handleLeaderUnload.bind(this),
    LEADER_STILL_ALIVE: this.handleLeaderStillAlive.bind(this),
    IS_LEADER_ALIVE: this.handleIsLeaderAlive.bind(this)
  }

  constructor(name: string, onBCMessageHandler: Function, onElectedLeaderHandler: Function) {
    this.onBCMessageHandler = onBCMessageHandler
    this.onElectedLeaderHandler = onElectedLeaderHandler
    this.channel = new BroadcastChannel(name)
    this.init()
  }

  private init() {
    this.postMessage({ type: 'REQUEST_LEADERSHIP' })
    this.leaderElectionTimeout = setTimeout(() => {
      this.isLeader = true
      logger.log('The current tab is the leader.')
    }, timeout)

    window?.addEventListener('beforeunload', this.eventListeners[0])
    this.channel.onmessage = this.eventListeners[1]
  }

  private chooseNextLeader() {
    return Math.floor(Math.random() * this.neighborhood.size)
  }

  private onBeforeUnloadHandler() {
    // We can't immediately say that a child or the leader is dead
    // beacause, on mobile a browser tab gets unloaded every time it no longer has focus
    if (this.isLeader) {
      this.postMessage({
        type: 'LEADER_UNLOAD',
        recipient: Array.from(this.neighborhood)[this.chooseNextLeader()],
        data: this.neighborhood
      })
    } else {
      this.postMessage({ type: 'CHILD_UNLOAD' })
    }

    window?.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private onMessageHandler({ data }: { data: BCMessage }) {
    const handler = this.messageHandlers[data.type]
    if (handler) {
      handler(data)
    } else {
      this.onBCMessageHandler(data)
    }
  }

  private handleRequestLeadership(data: BCMessage) {
    if (this.isLeader) {
      this.postMessage({ type: 'LEADER_EXISTS', recipient: data.sender })
      this.neighborhood.add(data.sender)
    }
  }

  private handleLeaderExists(data: BCMessage) {
    if (data.recipient === this.id) {
      clearTimeout(this.leaderElectionTimeout)
    }
  }

  private handleChildUnload(data: BCMessage) {
    if (this.isLeader) {
      this.pendingACKs.set(
        data.sender,
        setTimeout(() => {
          this.neighborhood.delete(data.sender)
          this.pendingACKs.delete(data.sender)
        }, timeout)
      )

      this.postMessage({ type: 'IS_CHILD_ALIVE', recipient: data.sender })
    }
  }

  private handleChildStillAlive(data: BCMessage) {
    if (this.isLeader) {
      this.clearPendingACK(data.sender)
    }
  }

  private handleIsChildAlive(data: BCMessage) {
    if (data.recipient === this.id) {
      this.postMessage({ type: 'CHILD_STILL_ALIVE' })
    }
  }

  private handleLeaderUnload(data: BCMessage) {
    if (data.recipient === this.id) {
      this.pendingACKs.set(
        data.sender,
        setTimeout(() => {
          this.isLeader = true
          this.neighborhood = data.data
          this.neighborhood.delete(this.id)
          this.onElectedLeaderHandler()
          logger.log('The current tab is the leader.')
        }, timeout)
      )
    }
    this.postMessage({ type: 'IS_LEADER_ALIVE', recipient: data.sender })
  }

  private handleLeaderStillAlive(data: BCMessage) {
    if (this.isLeader) {
      this.clearPendingACK(data.sender)
    }
  }

  private handleIsLeaderAlive(data: BCMessage) {
    if (data.recipient === this.id) {
      this.postMessage({ type: 'LEADER_STILL_ALIVE' })
    }
  }

  private clearPendingACK(sender: string) {
    const timeout = this.pendingACKs.get(sender)
    if (timeout) {
      clearTimeout(timeout)
      this.pendingACKs.delete(sender)
    }
  }

  postMessage(message: Omit<BCMessage, 'sender'>): void {
    this.channel.postMessage({ ...message, sender: this.id })
  }
}
