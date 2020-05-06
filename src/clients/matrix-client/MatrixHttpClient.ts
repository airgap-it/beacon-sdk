import axios, { AxiosResponse, Method as HttpMethod } from 'axios'

import { MatrixRequest } from './models/api-request/MatrixRequest'
import { MatrixResponse } from './models/api-response/MatrixResponse'

interface HttpOptions {
  accessToken?: string
  params?: {
    [key: string]: string | number
  }
}

const CLIENT_API_R0 = '/_matrix/client/r0'

export class MatrixHttpClient {
  public accessToken?: string

  constructor(private readonly baseUrl: string) {}

  public async get<T extends MatrixResponse<any>>(
    endpoint: string,
    options?: HttpOptions
  ): Promise<T> {
    return this.send('GET', endpoint, options)
  }

  public async post<T extends MatrixRequest, R extends MatrixResponse<T>>(
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

    if (options.accessToken) {
      entries.push(['Authorization', `Bearer ${options.accessToken}`])
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
