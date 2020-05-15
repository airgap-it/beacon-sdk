import axios, { AxiosResponse, Method as HttpMethod } from 'axios'

import { keys } from '../../utils/utils'
import { MatrixRequest, MatrixRequestParams } from './models/api/MatrixRequest'

interface HttpOptions {
  accessToken?: string
}

const CLIENT_API_R0 = '/_matrix/client/r0'

export class MatrixHttpClient {
  constructor(private readonly baseUrl: string) {}

  public async get<T>(
    endpoint: string,
    params: MatrixRequestParams<T>,
    options?: HttpOptions
  ): Promise<T> {
    return this.send('GET', endpoint, options, params)
  }

  public async post<T>(
    endpoint: string,
    body: MatrixRequest<T>,
    options?: HttpOptions,
    params?: MatrixRequestParams<T>
  ): Promise<T> {
    return this.send('POST', endpoint, options, params, body)
  }

  public async put<T>(
    endpoint: string,
    body: MatrixRequest<T>,
    options?: HttpOptions,
    params?: MatrixRequestParams<T>
  ): Promise<T> {
    return this.send('PUT', endpoint, options, params, body)
  }

  private async send<T>(
    method: HttpMethod,
    endpoint: string,
    config?: HttpOptions,
    requestParams?: MatrixRequestParams<T>,
    data?: MatrixRequest<T>
  ): Promise<T> {
    const headers = config ? this.getHeaders(config) : undefined
    const params = requestParams ? this.getParams(requestParams) : undefined

    const response: AxiosResponse<T> = await axios.request({
      method,
      url: endpoint,
      baseURL: this.apiUrl(CLIENT_API_R0),
      headers,
      data,
      params
    })

    return response.data
  }

  private getHeaders(options: HttpOptions): { [key: string]: any } | undefined {
    const headers: Record<string, any> = {}
    const entries: [string, any][] = []

    if (options.accessToken) {
      entries.push(['Authorization', `Bearer ${options.accessToken}`])
    }

    if (entries.length === 0) {
      return undefined
    }

    for (const [key, value] of entries) {
      headers[key] = value
    }

    return headers
  }

  private getParams(
    _params: MatrixRequestParams<any>
  ): { [key: string]: string | number | boolean } | undefined {
    if (!_params) {
      return undefined
    }

    const params = Object.assign(_params, {})
    keys(params).forEach((key) => params[key] === undefined && delete params[key])

    return params as { [key: string]: string | number | boolean }
  }

  private apiUrl(...parts: string[]): string {
    const apiBase = this.baseUrl.endsWith('/')
      ? this.baseUrl.substr(0, this.baseUrl.length - 1)
      : this.baseUrl

    const apiParts = parts.map((path) => (path.startsWith('/') ? path.substr(1) : path))

    return [apiBase, ...apiParts].join('/')
  }
}
