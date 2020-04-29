export enum ExposedPromiseStatus {
  INITIAL = 'initial',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

type Resolve<T> = (value?: T | PromiseLike<T>) => void
type Reject<U> = (reason?: U | PromiseLike<U>) => void

/* eslint-disable prefer-arrow/prefer-arrow-functions */

function notInitialized(): never {
  throw new Error('ExposedPromise not initialized yet.')
}
export class ExposedPromise<T, U = unknown> {
  public resolve: Resolve<T> = notInitialized
  public reject: Reject<U> = notInitialized
  public status: ExposedPromiseStatus = ExposedPromiseStatus.INITIAL
  public promiseResult: T | undefined
  public promiseError: U | undefined

  public promise: Promise<T>

  constructor() {
    this.promise = new Promise<T>(
      (innerResolve: Resolve<T>, innerReject: Reject<U>): void => {
        this.resolve = async (value?: T | PromiseLike<T>): Promise<void> => {
          this.status = ExposedPromiseStatus.PENDING
          try {
            this.promiseResult = await value
          } catch (innerReason) {
            return innerReject(innerReason)
          }
          this.status = ExposedPromiseStatus.RESOLVED

          return innerResolve(value)
        }
        this.reject = async (reason?: U | PromiseLike<U>): Promise<void> => {
          this.status = ExposedPromiseStatus.REJECTED
          this.promiseError = await reason

          return innerReject(reason)
        }
      }
    )
  }
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
