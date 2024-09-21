import { BeaconMessageType, StorageKey } from '@airgap/beacon-types'
import { Logger } from './Logger'
import { LocalStorage } from '../storage/LocalStorage'

type BCMessageType =
  | 'HEARTBEAT'
  | 'HEARTBEAT_ACK'
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
  private leaderID: string = ''
  private neighborhood: Set<string> = new Set()
  private channel: BroadcastChannel
  private eventListeners = [
    () => this.onBeforeUnloadHandler(),
    (message: any) => this.onMessageHandler(message)
  ]
  private onBCMessageHandler: Function
  private onElectedLeaderHandler: Function
  private pendingACKs: Map<string, NodeJS.Timeout> = new Map()
  private storage: LocalStorage = new LocalStorage()

  isLeader: boolean = false

  private messageHandlers: {
    [key in BCMessageType]?: (data: BCMessage) => void
  } = {
    HEARTBEAT: this.heartbeatHandler.bind(this),
    HEARTBEAT_ACK: this.heartbeatACKHandler.bind(this)
  }

  constructor(name: string, onBCMessageHandler: Function, onElectedLeaderHandler: Function) {
    this.onBCMessageHandler = onBCMessageHandler
    this.onElectedLeaderHandler = onElectedLeaderHandler
    this.channel = new BroadcastChannel(name)
    this.init()
  }

  private async init() {
    this.storage.subscribeToStorageChanged(async (event) => {
      if (
        event.eventType === 'entryModified' &&
        event.key === this.storage.getPrefixedKey(StorageKey.BC_NEIGHBORHOOD)
      ) {
        const newNeighborhood = !event.newValue ? this.neighborhood : JSON.parse(event.newValue)

        if (newNeighborhood[0] !== this.leaderID) {
          this.leaderElection()
        } else {
          clearTimeout(this.pendingACKs.get(this.leaderID))
        }

        this.neighborhood = newNeighborhood
      }
    })
    await this.requestLeadership()
  }

  private async requestLeadership() {
    const neighborhood = await this.storage.get(StorageKey.BC_NEIGHBORHOOD)

    if (!neighborhood.length) {
      this.isLeader = true
      logger.log('The current tab is the leader.')
    }

    neighborhood.push(this.id)
    this.leaderID = neighborhood[0]
    this.neighborhood = new Set(neighborhood)
    this.storage.set(StorageKey.BC_NEIGHBORHOOD, neighborhood)

    window?.addEventListener('beforeunload', this.eventListeners[0])
    this.channel.onmessage = this.eventListeners[1]

    this.initHeartbeat()
  }

  private initHeartbeat() {
    if (
      this.isLeader ||
      !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ) {
      return
    }

    setInterval(() => {
      this.leaderElection()
      this.postMessage({ type: 'HEARTBEAT' })
    }, timeout * 2)
  }

  private heartbeatHandler() {
    if (!this.isLeader) {
      return
    }
    this.postMessage({ type: 'HEARTBEAT_ACK' })
  }

  private heartbeatACKHandler() {
    this.pendingACKs.delete(this.leaderID)
  }

  private leaderElection() {
    this.pendingACKs.set(
      this.leaderID,
      setTimeout(() => {
        const neighborhood = Array.from(this.neighborhood)
        this.leaderID = neighborhood[0]
        if (neighborhood[0] !== this.id) {
          return
        }
        this.isLeader = true
        this.onElectedLeaderHandler()
        logger.log('The current tab is the leader.')
      }, timeout)
    )
  }

  private async onBeforeUnloadHandler() {
    const oldNeighborhood = this.neighborhood
    const newNeighborhood = new Set(this.neighborhood)
    newNeighborhood.delete(this.id)

    await this.storage.set(StorageKey.BC_NEIGHBORHOOD, Array.from(newNeighborhood))
    this.neighborhood = newNeighborhood

    // We can't immediately say that a child or the leader is dead
    // beacause, on mobile a browser tab gets unloaded every time it no longer has focus
    setTimeout(() => {
      this.storage.set(StorageKey.BC_NEIGHBORHOOD, Array.from(oldNeighborhood))
      this.neighborhood = oldNeighborhood
    }, timeout / 2)
  }

  private onMessageHandler({ data }: { data: BCMessage }) {
    const handler = this.messageHandlers[data.type]
    if (handler) {
      handler(data)
    } else {
      this.onBCMessageHandler(data)
    }
  }

  postMessage(message: Omit<BCMessage, 'sender'>): void {
    this.channel.postMessage({ ...message, sender: this.id })
  }
}
