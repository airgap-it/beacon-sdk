import { MatrixHttpClient } from '../MatrixHttpClient'

import { MatrixLoginResponse } from '../models/api/MatrixLogin'

export class MatrixUserService {
  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async login(
    user: string,
    password: string,
    deviceId: string
  ): Promise<MatrixLoginResponse> {
    return this.httpClient.post<MatrixLoginResponse>('/login', {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user
      },
      password,
      device_id: deviceId
    })
  }
}
