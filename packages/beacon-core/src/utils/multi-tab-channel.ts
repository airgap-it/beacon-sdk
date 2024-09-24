import { Logger } from '@airgap/beacon-core'
import { BeaconMessageType } from '@airgap/beacon-types'
import { createLeaderElection, BroadcastChannel, LeaderElector } from 'broadcast-channel'

type BCMessageType =
  | 'LEADER_DEAD'
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

const logger = new Logger('MultiTabChannel')
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)

export class MultiTabChannel {
  private id: string = String(Date.now())
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
    this.init()
      .then(() => logger.debug('MultiTabChannel', 'constructor', 'init', 'done'))
      .catch((err) => logger.warn(err.message))
  }

  private async init() {
    if (isMobile) {
      throw new Error('BroadcastChannel is not fully supported on mobile.')
    }

    const hasLeader = await this.elector.hasLeader()

    if (!hasLeader) {
      await this.elector.awaitLeadership()
      this.wasLeader = this.isLeader()
      this.wasLeader && logger.log('The current tab is the leader.')
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

  private async onMessageHandler(message: BCMessage) {
    if (message.recipient && message.recipient !== this.id) {
      return
    }

    if (message.type === 'LEADER_DEAD') {
      await this.elector.awaitLeadership()

      this.wasLeader = this.isLeader()

      if (this.isLeader()) {
        this.onElectedLeaderHandler()
        logger.log('The current tab is the leader.')
      }
      return
    }

    this.onBCMessageHandler(message)
  }

  isLeader(): boolean {
    return this.elector.isLeader
  }

  async getLeadership() {
    return this.elector.awaitLeadership()
  }

  async hasLeader(): Promise<boolean> {
    return this.elector.hasLeader()
  }

  postMessage(message: Omit<BCMessage, 'sender'>): void {
    this.channel.postMessage({ ...message, sender: this.id })
  }
}
