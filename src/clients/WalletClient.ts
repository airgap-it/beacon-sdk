import { BaseClient, BeaconBaseMessage, TransportType } from '..'

export class WalletClient extends BaseClient {
  private pendingRequests: BeaconBaseMessage[] = []

  public async init(): Promise<TransportType> {
    return super.init(false)
  }

  public async connect(
    newMessageCallback: (message: BeaconBaseMessage, connectionInfo: any) => void
  ): Promise<boolean> {
    this.handleResponse = (message, connectionInfo) => {
      if (!this.pendingRequests.some((request) => request.id === message.id)) {
        this.pendingRequests.push(message)
        console.log('PUSHING NEW REQUEST', message, connectionInfo)
        newMessageCallback(message, connectionInfo)
      }
    }

    return super._connect()
  }

  public async respond(message: BeaconBaseMessage) {
    const serializedMessage: string = await this.serializer.serialize(message)
    console.log('responding to message', message)
    const request = this.pendingRequests.find((pendingRequest) => pendingRequest.id === message.id)
    if (request) {
      this.pendingRequests = this.pendingRequests.filter(
        (pendingRequest) => pendingRequest.id !== message.id
      )
    }
    if (!this.transport) {
      throw new Error('no transport defined')
    }
    this.transport.send(serializedMessage, {})
  }
}
