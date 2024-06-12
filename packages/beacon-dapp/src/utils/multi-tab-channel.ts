import { Logger } from '@airgap/beacon-core'
import { createLeaderElection, BroadcastChannel } from 'broadcast-channel'

type Message = {
  type: string
  data: any
}

const logger = new Logger('MultiTabChannel')

export class MultiTabChannel {
  private channel = new BroadcastChannel('beacon-sdk_channel')
  private elector = createLeaderElection(this.channel)
  private eventListeners = [
    () => this.onBeforeUnloadHandler(),
    (message: any) => this.onMessageHandler(message)
  ]
  private bcMessageHandler: Function

  constructor(onBCMessageHandler: Function) {
    this.bcMessageHandler = onBCMessageHandler
    this.init().then(() => logger.debug('MultiTabChannel', 'constructor', 'init', 'done'))
  }

  private async init() {
    const isLeader = await this.elector.hasLeader()

    if (!isLeader) {
      await this.elector.awaitLeadership()
    }

    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('beforeunload', this.eventListeners[0])
    this.channel.addEventListener('message', this.eventListeners[1])
  }

  private async onBeforeUnloadHandler() {
    if (this.elector.isLeader) {
      await this.elector.die()
      this.channel.postMessage({ type: 'LEADER_DEAD' })
    }

    window.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private async onMessageHandler(message: Message) {
    if (message.type === 'LEADER_DEAD') {
      await this.elector.awaitLeadership()
      return
    }

    if (this.isLeader()) {
      this.bcMessageHandler(message)
    }
  }

  isLeader(): boolean {
    return this.elector.isLeader
  }

  postMessage(message: any): void {
    this.channel.postMessage({
      type: message.type,
      data: message.data
    })
  }
}
