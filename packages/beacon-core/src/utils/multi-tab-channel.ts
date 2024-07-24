import { Logger } from '@airgap/beacon-core'

type Message = {
  type: string
  id?: string
  data?: any
}

const logger = new Logger('MultiTabChannel')

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

  isLeader: boolean = false

  constructor(name: string, onBCMessageHandler: Function, onElectedLeaderHandler: Function) {
    this.onBCMessageHandler = onBCMessageHandler
    this.onElectedLeaderHandler = onElectedLeaderHandler
    this.channel = new BroadcastChannel(name)
    this.init().then(() => logger.debug('MultiTabChannel', 'constructor', 'init', 'done'))
  }

  private async init() {
    this.postMessage({ type: 'REQUEST_LEADERSHIP', id: this.id })
    this.leaderElectionTimeout = setTimeout(() => (this.isLeader = true), 1500)
    this.channel.onmessage = this.eventListeners[1]
    window?.addEventListener('beforeunload', this.eventListeners[0])
  }

  private chooseNextLeader() {
    return Math.floor(Math.random() * this.neighborhood.length)
  }

  private async onBeforeUnloadHandler() {
    if (this.isLeader) {
      this.postMessage({
        type: 'LEADER_DEAD',
        id: this.neighborhood[this.chooseNextLeader()],
        data: this.neighborhood
      })
      this.neighborhood.splice(0)
    } else {
      this.postMessage({ type: 'CHILD_DEAD' })
    }

    window?.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private async onMessageHandler(message: any) {
    if (message.data.type === 'REQUEST_LEADERSHIP' && this.isLeader) {
      this.postMessage({ type: 'LEADER_EXISTS' })
      this.neighborhood.push(message.data.id!)
      return
    }

    if (message.data.type === 'LEADER_EXISTS') {
      clearTimeout(this.leaderElectionTimeout)
      return
    }

    if (message.data.type === 'CHILD_DEAD' && this.isLeader) {
      this.neighborhood = this.neighborhood.filter((id) => id !== message.data.id)
      return
    }

    if (message.data.type === 'LEADER_DEAD' && message.data.id === this.id) {
      this.isLeader = true
      this.neighborhood = message.data.data.filter((id: string) => this.id !== id)
      this.onElectedLeaderHandler()
      return
    }

    this.onBCMessageHandler(message.data)
  }

  postMessage(message: Message): void {
    this.channel.postMessage(message)
  }
}
