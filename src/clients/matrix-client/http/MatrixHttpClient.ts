import axios, { AxiosResponse, Method as HttpMethod } from 'axios'

import { MatrixAuthenticationResponse } from './response/MatrixAuthenticationResponse'
import { MatrixSyncResponse, MatrixSyncRoomResponse } from './response/MatrixSyncResponse'

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

  public async authenticate(
    user: string,
    password: string,
    data: any = {}
  ): Promise<MatrixAuthenticationResponse> {
    const response = await this.post<MatrixAuthenticationResponse>('/login', {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user
      },
      password,
      ...data
    })

    this.accessToken = response.access_token

    return response
  }

  public async sync(): Promise<MatrixSyncRoomResponse> {
    const response = await this.get<MatrixSyncResponse>('/sync', {
      requiresAuthorization: true,
      params: this.syncToken ? { since: this.syncToken } : undefined
    })

    this.syncToken = response.next_batch

    return response.rooms
  }

  public async joinRoom(roomId: string): Promise<string> {
    return this.post<string>(`/rooms/${roomId}/join`, {}, { requiresAuthorization: true })
  }

  public async invite(userId: string, roomId: string): Promise<void> {
    await this.post(`/rooms/${roomId}/invite`, { user_id: userId }, { requiresAuthorization: true })
  }

  private async get<T>(endpoint: string, options?: HttpOptions): Promise<T> {
    return this.send('GET', endpoint, options)
  }

  private async post<T>(endpoint: string, body: any, options?: HttpOptions): Promise<T> {
    return this.send('POST', endpoint, options, body)
  }

  private async send<T>(
    method: HttpMethod,
    endpoint: string,
    config?: HttpOptions,
    data?: any
  ): Promise<T> {
    const headers = config ? this.getHeaders(config) : undefined
    const response: AxiosResponse<T> = await axios.request({
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
