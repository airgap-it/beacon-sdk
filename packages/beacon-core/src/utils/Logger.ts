/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { getDebugEnabled } from '../debug'

// Code taken from https://www.bennadel.com/blog/3941-styling-console-log-output-formatting-with-css.htm
// const echo = (() => {
//   let queue: any[] = []
//   const ECHO_TOKEN = {}
//   const RESET_INPUT = '%c '
//   const RESET_CSS = ''

//   // Attach formatting utility method.
//   function alertFormatting(value: any): any {
//     queue.push({
//       value: value,
//       css:
//         'display: inline-block ; background-color: #e0005a ; color: #ffffff ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;'
//     })

//     return ECHO_TOKEN
//   }

//   // Attach formatting utility method.
//   function warningFormatting(value: any): any {
//     queue.push({
//       value: value,
//       css:
//         'display: inline-block ; background-color: gold ; color: black ; font-weight: bold ; padding: 3px 7px 3px 7px ; border-radius: 3px 3px 3px 3px ;'
//     })

//     return ECHO_TOKEN
//   }

//   // I provide an echo-based proxy to the given Console Function. This uses an
//   // internal queue to aggregate values before calling the given Console
//   // Function with the desired formatting.
//   function using(consoleFunction: any): any {
//     function consoleFunctionProxy() {
//       // As we loop over the arguments, we're going to aggregate a set of
//       // inputs and modifiers. The Inputs will ultimately be collapsed down
//       // into a single string that acts as the first console.log parameter
//       // while the modifiers are then SPREAD into console.log as 2...N.
//       // --
//       // NOTE: After each input/modifier pair, I'm adding a RESET pairing.
//       // This implicitly resets the CSS after every formatted pairing.
//       var inputs = []
//       var modifiers = []

//       for (var i = 0; i < arguments.length; i++) {
//         // When the formatting utility methods are called, they return
//         // a special token. This indicates that we should pull the
//         // corresponding value out of the QUEUE instead of trying to
//         // output the given argument directly.
//         if (arguments[i] === ECHO_TOKEN) {
//           var item = queue.shift()

//           inputs.push('%c' + item.value, RESET_INPUT)
//           modifiers.push(item.css, RESET_CSS)

//           // For every other argument type, output the value directly.
//         } else {
//           var arg = arguments[i]

//           if (typeof arg === 'object' || typeof arg === 'function') {
//             inputs.push('%o', RESET_INPUT)
//             modifiers.push(arg, RESET_CSS)
//           } else {
//             inputs.push('%c' + arg, RESET_INPUT)
//             modifiers.push(RESET_CSS, RESET_CSS)
//           }
//         }
//       }

//       consoleFunction(inputs.join(''), ...modifiers)

//       // Once we output the aggregated value, reset the queue. This should have
//       // already been emptied by the .shift() calls; but the explicit reset
//       // here acts as both a marker of intention as well as a fail-safe.
//       queue = []
//     }

//     return consoleFunctionProxy
//   }

//   return {
//     // Console(ish) functions.
//     log: using(console.log),
//     warn: using(console.warn),
//     error: using(console.error),
//     trace: using(console.trace),
//     group: using(console.group),
//     groupEnd: using(console.groupEnd),

//     // Formatting functions.
//     asAlert: alertFormatting,
//     asWarning: warningFormatting
//   }
// })()

export interface LoggerInterface {
  debug(method: string, ...args: any[]): void
  log(method: string, ...args: any[]): void
  warn(method: string, ...args: any[]): void
  error(method: string, ...args: any[]): void
}

/**
 * The logger that is used internally
 */
export class InternalLogger {
  constructor() {}

  public debug(name: string, method: string, ...args: any[]): void {
    this._log('debug', name, method, args)
  }

  public log(name: string, method: string, ...args: any[]): void {
    this._log('log', name, method, args)
  }

  public warn(name: string, method: string, ...args: any[]): void {
    this._log('warn', name, method, args)
  }

  public error(name: string, method: string, ...args: any[]): void {
    this._log('error', name, method, args)
  }

  private _log(
    type: 'debug' | 'log' | 'warn' | 'error',
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

  public debug(method: string, ...args: any[]): void {
    logger.debug(this.name, method, args)
  }

  public log(method: string, ...args: any[]): void {
    logger.log(this.name, method, args)
  }

  public warn(method: string, ...args: any[]): void {
    logger.warn(this.name, method, args)
  }

  public error(method: string, ...args: any[]): void {
    logger.error(this.name, method, args)
  }
}

const loggerWrapper: LoggerInterface = new Logger('')
let logger: LoggerInterface = new InternalLogger()

export const setLogger = (newLogger: LoggerInterface): void => {
  logger = newLogger
}

export const getLogger = (): LoggerInterface => loggerWrapper
