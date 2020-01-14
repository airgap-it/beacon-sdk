import { BaseMessage } from '../Messages'
import { BaseClient } from './Client'

export class WalletClient extends BaseClient {
  public async connect(newMessageCallback: (message: BaseMessage) => void): Promise<boolean> {
    this.handleResponse = newMessageCallback

    return super._connect()
  }
}
