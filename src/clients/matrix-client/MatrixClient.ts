import { MatrixClientOptions } from './MatrixClientOptions'
import { MatrixHttpClient } from './http/MatrixHttpClient'

export class MatrixClient {
  // TODO: make private when used
  public userId?: string
  public deviceId?: string

  public static create(config: MatrixClientOptions): MatrixClient {
    const httpClient = new MatrixHttpClient(config.baseUrl)

    return new MatrixClient(httpClient)
  }

  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async login(data: { user: string; password: string; deviceId: string }): Promise<void> {
    const response = await this.httpClient.authenticate(data.user, data.password, {
      deviceId: data.deviceId
    })

    this.userId = response.user_id
    this.deviceId = response.device_id
  }
}
