import { MatrixHttpClient } from '../MatrixHttpClient'

import { MatrixLoginResponse } from '../models/api-response/MatrixLoginResponse'
import { MatrixLoginRequest } from '../models/api-request/MatrixLoginRequest'

import { MatrixSyncResponse } from '../models/api-response/MatrixSyncResponse'

export class MatrixAccountService {
  // TODO: make private when used
  public userId?: string
  public deviceId?: string

  private syncToken?: string

  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async login(
    user: string,
    password: string,
    deviceId: string
  ): Promise<MatrixLoginResponse> {
    const response = await this.httpClient.post<MatrixLoginRequest, MatrixLoginResponse>('/login', {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user
      },
      password,
      device_id: deviceId
    })

    return response
  }

  public async sync(accessToken: string, fullState: boolean = false): Promise<MatrixSyncResponse> {
    const response = await this.httpClient.get<MatrixSyncResponse>('/sync', {
      accessToken,
      params: {
        since: this.syncToken,
        full_state: fullState
      }
    })

    this.syncToken = response.next_batch

    return response
  }
}
