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
    this.channel.onmessage = this.eventListeners[1]
  }

  private async onBeforeUnloadHandler() {
    await this.killLeader()

    window.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.channel.onmessage)
  }

  private onMessageHandler(message: Message) {
    if (message.type === 'LEADER_DEAD') {
      this.elector.awaitLeadership().then(() => logger.log('The tab is now the leader'))

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

  async killLeader() {
    if (!this.isLeader) {
      return
    }

    await this.elector.die()
    this.postMessage({ type: 'LEADER_DEAD' })
  }

  postMessage(message: any): void {
    this.channel.postMessage(message)
  }
}
