import axios, { AxiosError, AxiosResponse, CancelTokenSource, Method as HttpMethod } from 'axios'

import { keys } from '@mavrykdynamics/beacon-utils'
import { MatrixRequest, MatrixRequestParams } from './models/api/MatrixRequest'
import { Logger } from '@mavrykdynamics/beacon-core'

const logger = new Logger('MatrixHttpClient')

interface HttpOptions {
  accessToken?: string
}

const CLIENT_API_R0 = '/_matrix/client/r0'

/**
 * Handling the HTTP connection to the matrix synapse node
 */
export class MatrixHttpClient {
  private readonly cancelTokenSource: CancelTokenSource

  constructor(private readonly baseUrl: string) {
    this.cancelTokenSource = axios.CancelToken.source()
  }

  /**
   * Get data from the synapse node
   *
   * @param endpoint
   * @param options
   */
  public async get<T>(
    endpoint: string,
    params?: MatrixRequestParams<T>,
    options?: HttpOptions
  ): Promise<T> {
    return this.send('GET', endpoint, options, params)
  }

  /**
   * Post data to the synapse node
   *
   * @param endpoint
   * @param body
   * @param options
   * @param params
   */
  public async post<T>(
    endpoint: string,
    body: MatrixRequest<T>,
    options?: HttpOptions,
    params?: MatrixRequestParams<T>
  ): Promise<T> {
    return this.send('POST', endpoint, options, params, body)
  }

  /**
   * Put data to the synapse node
   *
   * @param endpoint
   * @param body
   * @param options
   * @param params
   */
  public async put<T>(
    endpoint: string,
    body: MatrixRequest<T>,
    options?: HttpOptions,
    params?: MatrixRequestParams<T>
  ): Promise<T> {
    return this.send('PUT', endpoint, options, params, body)
  }

  public async cancelAllRequests(): Promise<void> {
    return this.cancelTokenSource.cancel('Manually cancelled')
  }

  /**
   * Send a request to the synapse node
   *
   * @param method
   * @param endpoint
   * @param config
   * @param requestParams
   * @param data
   */
  private async send<T>(
    method: HttpMethod,
    endpoint: string,
    config?: HttpOptions,
    requestParams?: MatrixRequestParams<T>,
    data?: MatrixRequest<T>
  ): Promise<T> {
    const headers = config ? this.getHeaders(config) : undefined
    const params = requestParams ? this.getParams(requestParams) : undefined

    let response: AxiosResponse<T>
    try {
      response = await axios.request({
        method,
        url: endpoint,
        baseURL: this.apiUrl(CLIENT_API_R0),
        headers,
        data,
        params,
        cancelToken: this.cancelTokenSource.token
      })
    } catch (error) {
      const axiosError: AxiosError = error as any
      logger.error('send', axiosError.code, axiosError.message, (axiosError as any).response.data)
      throw (error as any).response.data
    }

    return response.data
  }

  /**
   * Get the headers based on the options object
   *
   * @param options
   */
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

  /**
   * Get parameters
   *
   * @param _params
   */
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

  /**
   * Construct API URL
   */
  private apiUrl(...parts: string[]): string {
    const apiBase = this.baseUrl.endsWith('/')
      ? this.baseUrl.substr(0, this.baseUrl.length - 1)
      : this.baseUrl

    const apiParts = parts.map((path) => (path.startsWith('/') ? path.substr(1) : path))

    return [apiBase, ...apiParts].join('/')
  }
}
