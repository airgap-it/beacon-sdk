export interface ExposedPromise<T> {
  promise: Promise<T>
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: unknown): void
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

  const promise: Promise<T> = new Promise<T>(
    (innerResolve: Resolve<T>, innerReject: Reject): void => {
      resolve = innerResolve
      reject = innerReject
    }
  )

  return { promise, resolve, reject }
}
/* eslint-enable prefer-arrow/prefer-arrow-functions */
