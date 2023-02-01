/**
 *  @category Error
 *  @description Error that indicates the wallet returned an invalid namespace
 */
export class InvalidReceivedSessionNamespace extends Error {
  name = 'InvalidReceivedSessionNamespace'

  constructor(
    public messageWc: string,
    public codeWc: number,
    type: 'invalid' | 'incomplete',
    public data?: string | string[]
  ) {
    super()
    const baseMessage = `${codeWc}: ${messageWc}.`
    this.message = data
      ? type === 'incomplete'
        ? ` ${baseMessage} "${data}" is missing in the session namespace.`
        : ` ${baseMessage} "${data}" is invalid.`
      : baseMessage
  }
}

/**
 *  @category Error
 *  @description Error that indicates there is no active session
 */
export class NotConnected extends Error {
  name = 'NotConnected'

  constructor() {
    super('Not connected, no active session')
  }
}

/**
 *  @category Error
 *  @description Error that indicates the session is invalid
 */
export class InvalidSession extends Error {
  name = 'InvalidSession'

  constructor(message: string) {
    super(message)
  }
}
