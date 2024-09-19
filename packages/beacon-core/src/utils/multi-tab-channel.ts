import { BeaconMessageType } from '@airgap/beacon-types'

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
  | BeaconMessageType

type BCMessage = {
  type: BCMessageType
  sender: string
  recipient?: string
  data?: any
}

export class MultiTabChannel {
  private id: string = String(Date.now())
  private neighborhood: string[] = []
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

  constructor(name: string, onBCMessageHandler: Function, onElectedLeaderHandler: Function) {
    this.onBCMessageHandler = onBCMessageHandler
    this.onElectedLeaderHandler = onElectedLeaderHandler
    this.channel = new BroadcastChannel(name)
    this.init()
  }

  private init() {
    this.postMessage({ type: 'REQUEST_LEADERSHIP' })
    this.leaderElectionTimeout = setTimeout(() => (this.isLeader = true), 1000)
    this.channel.onmessage = this.eventListeners[1]
    window?.addEventListener('beforeunload', this.eventListeners[0])
  }

  private chooseNextLeader() {
    return Math.floor(Math.random() * this.neighborhood.length)
  }

  private onBeforeUnloadHandler() {
    if (this.isLeader) {
      this.postMessage({
        type: 'LEADER_UNLOAD',
        recipient: this.neighborhood[this.chooseNextLeader()],
        data: this.neighborhood
      })
    } else {
      this.postMessage({ type: 'CHILD_UNLOAD' })
    }

    window?.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private onMessageHandler({ data }: { data: BCMessage }) {
    if (data.type === 'REQUEST_LEADERSHIP' && this.isLeader) {
      this.postMessage({ type: 'LEADER_EXISTS', recipient: data.sender })
      this.neighborhood.push(data.sender!)
      return
    }

    if (data.type === 'LEADER_EXISTS') {
      data.recipient === this.id && clearTimeout(this.leaderElectionTimeout)
      return
    }

    if (data.type === 'CHILD_UNLOAD' && this.isLeader) {
      this.pendingACKs.set(
        data.sender,
        setTimeout(() => {
          this.neighborhood = this.neighborhood.filter((id) => id !== data.sender)
          this.pendingACKs.delete(data.sender)
        }, 1000)
      )
      // on mobile a browser tab gets unloaded every time it no longer has focus
      this.postMessage({ type: 'IS_CHILD_ALIVE', recipient: data.sender })
      return
    }

    if (data.type === 'CHILD_STILL_ALIVE') {
      if (this.isLeader) {
        clearTimeout(this.pendingACKs.get(data.sender))
        this.pendingACKs.delete(data.sender)
      }
    }

    if (data.type === 'IS_CHILD_ALIVE') {
      data.recipient === this.id && this.postMessage({ type: 'CHILD_STILL_ALIVE' })
      return
    }

    if (data.type === 'LEADER_UNLOAD') {
      if (data.recipient === this.id) {
        this.pendingACKs.set(
          data.sender,
          setTimeout(() => {
            this.isLeader = true
            this.neighborhood = data.data.filter((id: string) => this.id !== id)
            this.onElectedLeaderHandler()
          }, 1000)
        )
      }
      this.postMessage({ type: 'IS_LEADER_ALIVE', recipient: data.sender })
      return
    }

    if (data.type === 'LEADER_STILL_ALIVE') {
      if (this.isLeader) {
        clearTimeout(this.pendingACKs.get(data.sender))
        this.pendingACKs.delete(data.sender)
      }
    }

    if (data.type === 'IS_LEADER_ALIVE') {
      data.recipient === this.id && this.postMessage({ type: 'CHILD_STILL_ALIVE' })
      return
    }

    this.onBCMessageHandler(data)
  }

  postMessage(message: Omit<BCMessage, 'sender'>): void {
    this.channel.postMessage({ ...message, sender: this.id })
  }
}
