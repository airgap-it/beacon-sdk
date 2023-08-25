import { getDebugEnabled } from '../debug'

export interface LoggerInterface {
  debug(method: string, ...args: any[]): void
  log(method: string, ...args: any[]): void
  warn(method: string, ...args: any[]): void
  error(method: string, ...args: any[]): void
  time(start: boolean, label?: string): void
  timeLog(method: string, ...args: any[]): void
}

/**
 * The logger that is used internally
 */
export class InternalLogger implements LoggerInterface {
  constructor() {}

  debug(name: string, method: string, ...args: any[]): void {
    this._log('debug', name, method, args)
  }

  log(name: string, method: string, ...args: any[]): void {
    this._log('log', name, method, args)
  }

  warn(name: string, method: string, ...args: any[]): void {
    this._log('warn', name, method, args)
  }

  error(name: string, method: string, ...args: any[]): void {
    this._log('error', name, method, args)
  }

  time(start: boolean, label?: string | undefined): void {
    start ? console.time(label) : console.timeEnd(label)
  }

  timeLog(name: string, method: string, ...args: any[]): void {
    this._log('timeLog', name, method, args)
  }

  private _log(
    type: 'debug' | 'log' | 'warn' | 'error' | 'timeLog',
    name: string,
    method: string,
    args: any[] = []
  ): void {
    if (!getDebugEnabled()) {
      return
    }

    let groupText = `[BEACON] ${new Date().toISOString()} [${name}](${method})`
    let data = args
    if (args[0] && typeof args[0] === 'string') {
      groupText += ` ${args[0]}`
      data = args.slice(1)
    }

    switch (type) {
      case 'error':
        console.group(groupText)
        console.error(...data)
        break
      case 'warn':
        console.group(groupText)
        console.warn(...data)
        break
      case 'debug':
        console.groupCollapsed(groupText)
        console.debug(...data)
        break
      case 'timeLog':
        console.group(groupText)
        console.timeLog(...data)
        break
      default:
        console.group(groupText)
        console.log(...data)
    }
    console.groupEnd()

    // echo.group(echo.asWarning(`[BEACON] ${message}`))
    // echo.log(echo.asWarning(`[${this.name}]`), echo.asAlert(`(${method})`), ...args)
    // echo.groupEnd()
  }
}

export class Logger implements LoggerInterface {
  private readonly name: string

  constructor(service: string) {
    this.name = service
  }

  debug(method: string, ...args: any[]): void {
    logger.debug(this.name, method, args)
  }

  log(method: string, ...args: any[]): void {
    logger.log(this.name, method, args)
  }

  warn(method: string, ...args: any[]): void {
    logger.warn(this.name, method, args)
  }

  error(method: string, ...args: any[]): void {
    logger.error(this.name, method, args)
  }

  time(start: boolean, label?: string | undefined): void {
    logger.time(start, label)
  }

  timeLog(method: string, ...args: any[]): void {
    logger.timeLog(method, args)
  }
}

const loggerWrapper: LoggerInterface = new Logger('')
let logger: LoggerInterface = new InternalLogger()

export const setLogger = (newLogger: LoggerInterface): void => {
  logger = newLogger
}

export const getLogger = (): LoggerInterface => loggerWrapper
