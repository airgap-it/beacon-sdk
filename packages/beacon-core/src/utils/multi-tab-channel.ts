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
  // Auxiliary variable needed for handling beforeUnload.
  // Closing a tab causes the elector to be killed immediately
  private wasLeader: boolean = false

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
      this.wasLeader = this.isLeader()
    }

    this.channel.onmessage = this.eventListeners[1]
    window?.addEventListener('beforeunload', this.eventListeners[0])
  }

  private async onBeforeUnloadHandler() {
    if (this.wasLeader) {
      await this.elector.die()
      this.postMessage({ type: 'LEADER_DEAD' })
    }

    window?.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private async onMessageHandler(message: Message) {
    if (this.channel.isClosed) {
      return
    }
    if (message.type === 'LEADER_DEAD') {
      await this.elector.awaitLeadership()

      this.wasLeader = this.isLeader()

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

  async getLeadership() {
    if (this.channel.isClosed) {
      return
    }
    return this.elector.awaitLeadership()
  }

  async hasLeader(): Promise<boolean> {
    if (this.channel.isClosed) {
      return false;
    }
    return this.elector.hasLeader()
  }

  postMessage(message: any): void {
    if (this.channel.isClosed) {
      return
    }
    this.channel.postMessage(message)
  }

  async destroy() {
    if (!this.channel || this.channel.isClosed) {
      return
    }
    if (this.wasLeader) {
      await this.elector.die()
      this.postMessage({ type: 'LEADER_DEAD' })
    }
    this.channel.removeEventListener('message', this.eventListeners[1])
    await this.channel.close()
  }
}
