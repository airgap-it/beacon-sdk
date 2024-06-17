import { Logger } from '@airgap/beacon-core'
import { createLeaderElection, BroadcastChannel, LeaderElector } from 'broadcast-channel'

type Message = {
  type: string
  id: string
  data: any
}

const logger = new Logger('MultiTabChannel')

export class MultiTabChannel {
  private channel: BroadcastChannel
  private elector: LeaderElector
  private eventListeners = [
    () => this.onBeforeUnloadHandler(),
    (message: any) => this.onMessageHandler(message)
  ]
  private onBCMessageHandler: Function
  private onElectedLeaderHandler: Function

  constructor(name: string, onBCMessageHandler: Function, onElectedLeaderHandler: Function) {
    this.onBCMessageHandler = onBCMessageHandler
    this.onElectedLeaderHandler = onElectedLeaderHandler
    this.channel = new BroadcastChannel(name)
    this.elector = createLeaderElection(this.channel)
    this.init().then(() => logger.debug('MultiTabChannel', 'constructor', 'init', 'done'))
  }

  private async init() {
    const hasLeader = await this.elector.hasLeader()

    if (!hasLeader) {
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

      if (this.isLeader()) {
        this.onElectedLeaderHandler()
      }
      return
    }

    this.onBCMessageHandler(message)
  }

  isLeader(): boolean {
    return this.elector.isLeader
  }

  postMessage(message: any): void {
    this.channel.postMessage(message)
  }
}
