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
  private readonly _promise: Promise<T>

  private _resolve: Resolve<T> = notInitialized
  private _reject: Reject<U> = notInitialized
  private _status: ExposedPromiseStatus = ExposedPromiseStatus.INITIAL
  private _promiseResult: T | undefined
  private _promiseError: U | undefined

  public get promise(): Promise<T> {
    return this._promise
  }

  public get resolve(): Resolve<T> {
    return this._resolve
  }
  public get reject(): Reject<U> {
    return this._reject
  }
  public get status(): ExposedPromiseStatus {
    return this._status
  }
  public get promiseResult(): T | undefined {
    return this._promiseResult
  }
  public get promiseError(): U | undefined {
    return this._promiseError
  }

  constructor() {
    this._promise = new Promise<T>((innerResolve: Resolve<T>, innerReject: Reject<U>): void => {
      this._resolve = async (value?: T | PromiseLike<T>): Promise<void> => {
        this._status = ExposedPromiseStatus.PENDING
        try {
          this._promiseResult = await value
        } catch (innerReason) {
          return innerReject(innerReason)
        }
        this._status = ExposedPromiseStatus.RESOLVED

        return innerResolve(value)
      }
      this._reject = async (reason?: U | PromiseLike<U>): Promise<void> => {
        this._status = ExposedPromiseStatus.REJECTED
        this._promiseError = await reason

        return innerReject(reason)
      }
    })
  }

  public isPending(): boolean {
    return this.status === ExposedPromiseStatus.PENDING
  }

  public isResolved(): boolean {
    return this.status === ExposedPromiseStatus.RESOLVED
  }

  public isRejected(): boolean {
    return this.status === ExposedPromiseStatus.REJECTED
  }

  public isSettled(): boolean {
    return this.isPending() || this.isRejected()
  }
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
