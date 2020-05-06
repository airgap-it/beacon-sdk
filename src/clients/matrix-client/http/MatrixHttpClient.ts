import axios, { AxiosResponse, Method as HttpMethod } from 'axios'

import { MatrixRequest } from './request/MatrixRequest'
import { MatrixResponse } from './response/MatrixResponse'

import { MatrixLoginResponse } from './response/MatrixLoginResponse'
import { MatrixLoginRequest } from './request/MatrixLoginRequest'

import { MatrixSyncResponse } from './response/MatrixSyncResponse'

import { MatrixRoomJoinRequest } from './request/MatrixRoomJoinRequest'
import { MatrixRoomJoinResponse } from './response/MatrixRoomJoinResponse'

import { MatrixRoomInviteRequest } from './request/MatrixRoomInviteRequest'
import { MatrixRoomInviteResponse } from './response/MatrixRoomInviteResponse'

interface HttpOptions {
  requiresAuthorization?: boolean
  params?: {
    [key: string]: string | number
  }
}

const CLIENT_API_R0 = '/_matrix/client/r0'

export class MatrixHttpClient {
  private accessToken?: string
  private syncToken?: string

  constructor(private readonly baseUrl: string) {}

  public async login(
    user: string,
    password: string,
    deviceId: string
  ): Promise<MatrixLoginResponse> {
    const response = await this.post<MatrixLoginRequest, MatrixLoginResponse>('/login', {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user
      },
      password,
      device_id: deviceId
    })

    this.accessToken = response.access_token

    return response
  }

  public async sync(): Promise<MatrixSyncResponse> {
    const response = await this.get<MatrixSyncResponse>('/sync', {
      requiresAuthorization: true,
      params: this.syncToken ? { since: this.syncToken } : undefined
    })

    this.syncToken = response.next_batch

    return response
  }

  public async invite(userId: string, roomId: string): Promise<MatrixRoomInviteResponse> {
    return this.post<MatrixRoomInviteRequest, MatrixRoomInviteResponse>(
      `/rooms/${roomId}/invite`,
      { user_id: userId },
      { requiresAuthorization: true }
    )
  }

  public async joinRoom(roomId: string): Promise<MatrixRoomJoinRequest> {
    return this.post<MatrixRoomJoinRequest, MatrixRoomJoinResponse>(
      `/rooms/${roomId}/join`,
      {},
      { requiresAuthorization: true }
    )
  }

  private async get<T extends MatrixResponse<any>>(
    endpoint: string,
    options?: HttpOptions
  ): Promise<T> {
    return this.send('GET', endpoint, options)
  }

  private async post<T extends MatrixRequest, R extends MatrixResponse<T>>(
    endpoint: string,
    body: T,
    options?: HttpOptions
  ): Promise<R> {
    return this.send('POST', endpoint, options, body)
  }

  private async send<T extends MatrixRequest, R extends MatrixResponse<T>>(
    method: HttpMethod,
    endpoint: string,
    config?: HttpOptions,
    data?: T
  ): Promise<R> {
    const headers = config ? this.getHeaders(config) : undefined
    const response: AxiosResponse<R> = await axios.request({
      method,
      url: endpoint,
      baseURL: this.apiUrl(CLIENT_API_R0),
      headers,
      data,
      params: config ? config.params : undefined
    })

    return response.data
  }

  private getHeaders(options: HttpOptions): { [key: string]: any } {
    const headers = {}
    const entries: [string, any][] = []

    if (options.requiresAuthorization) {
      if (!this.accessToken) {
        throw new Error('Request requires authorization but no access token has been provided.')
      }
      entries.push(['Authorization', `Bearer ${this.accessToken}`])
    }

    for (let [key, value] of entries) {
      headers[key] = value
    }

    return headers
  }

  private apiUrl(...parts: string[]): string {
    const apiBase = this.baseUrl.endsWith('/')
      ? this.baseUrl.substr(0, this.baseUrl.length - 1)
      : this.baseUrl

    const apiParts = parts.map((path) => (path.startsWith('/') ? path.substr(1) : path))
    return [apiBase, ...apiParts].join('/')
  }
}
