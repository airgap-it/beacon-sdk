import { BaseMessage } from '../Messages'
import { TransportType } from '../transports/Transport'
import { BaseClient } from './Client'

export class WalletClient extends BaseClient {
  private pendingRequests: BaseMessage[] = []

  public async init(): Promise<TransportType> {
    return super.init(false)
  }

  public async connect(
    newMessageCallback: (message: BaseMessage, connectionInfo: any) => void
  ): Promise<boolean> {
    this.handleResponse = (message, connectionInfo) => {
      if (!this.pendingRequests.some(request => request.id === message.id)) {
        this.pendingRequests.push(message)
        console.log('PUSHING NEW REQUEST', message, connectionInfo)
        newMessageCallback(message, connectionInfo)
      }
    }

    return super._connect()
  }

  public async respond(requestId: string, message: string) {
    console.log('responding to message', message)
    const request = this.pendingRequests.find(request => request.id === requestId)
    if (request) {
      this.pendingRequests = this.pendingRequests.filter(request => request.id !== requestId)
    }
    if (!this.transport) {
      throw new Error('no transport defined')
    }
    this.transport.send(message, {})
  }
}
