type Message = {
  type: string
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
    this.postMessage({ type: 'REQUEST_LEADERSHIP', sender: this.id })
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
        type: 'LEADER_DEAD',
        sender: this.id,
        recipient: this.neighborhood[this.chooseNextLeader()],
        data: this.neighborhood
      })
      this.neighborhood.splice(0)
      this.isLeader = false
    } else {
      this.postMessage({ type: 'CHILD_UNLOAD', sender: this.id })
    }

    window?.removeEventListener('beforeunload', this.eventListeners[0])
    this.channel.removeEventListener('message', this.eventListeners[1])
  }

  private onMessageHandler({ data }: { data: Message }) {
    if (data.type === 'REQUEST_LEADERSHIP' && this.isLeader) {
      this.postMessage({ type: 'LEADER_EXISTS', sender: this.id, recipient: data.sender })
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
      return
    }

    if (data.type === 'CHILD_STILL_ALIVE' && this.isLeader) {
      clearTimeout(this.pendingACKs.get(data.sender))
      this.pendingACKs.delete(data.sender)
    }

    if (data.type === 'LEADER_DEAD') {
      if (data.recipient === this.id) {
        this.isLeader = true
        this.neighborhood = data.data.filter((id: string) => this.id !== id)
        this.onElectedLeaderHandler()
      }
      return
    }

    this.onBCMessageHandler(data)
  }

  postMessage(message: Message): void {
    this.channel.postMessage(message)
  }
}
