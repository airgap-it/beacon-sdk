export enum ExposedPromiseStatus {
  INITIAL = 'initial',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export interface ExposedPromise<T, U = unknown> {
  promise: Promise<T>
  status: ExposedPromiseStatus
  promiseResult: T | undefined
  promiseError: unknown
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: U): void
}

type Resolve<T> = (value?: T | PromiseLike<T>) => void
type Reject = (reason?: unknown) => void

/* eslint-disable prefer-arrow/prefer-arrow-functions */

function notInitialized(): never {
  throw new Error('ExposedPromise not initialized yet.')
}
export function exposedPromise<T>(): ExposedPromise<T> {
  let resolve: Resolve<T> = notInitialized
  let reject: Reject = notInitialized
  let status: ExposedPromiseStatus = ExposedPromiseStatus.INITIAL
  let promiseResult: T | undefined
  let promiseError: unknown | undefined

  const promise: Promise<T> = new Promise<T>(
    (innerResolve: Resolve<T>, innerReject: Reject): void => {
      resolve = async (value?: T | PromiseLike<T>): Promise<void> => {
        status = ExposedPromiseStatus.PENDING
        try {
          promiseResult = await value
        } catch (innerReason) {
          return innerReject(innerReason)
        }
        status = ExposedPromiseStatus.RESOLVED

        return innerResolve(value)
      }
      reject = async (reason?: unknown): Promise<void> => {
        status = ExposedPromiseStatus.REJECTED
        promiseError = await reason

        return innerReject(reason)
      }
    }
  )

  return { promise, status, promiseResult, promiseError, resolve, reject }
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
