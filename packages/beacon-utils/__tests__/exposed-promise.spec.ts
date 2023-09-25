import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { ExposedPromise, ExposedPromiseStatus } from '../src/utils/exposed-promise'

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const WAIT_TIME = 0

const cancelTimeoutAndSettle = (
  timeout: NodeJS.Timeout,
  settleFunction: (result?: any) => void
) => {
  if (timeout) {
    clearTimeout(timeout)
  }
  return settleFunction
}

const getExpectedPromiseOutcome = (
  exposed: ExposedPromise<any, any>,
  expectedStatus: ExposedPromiseStatus
) => {
  const resolvePredicate = expectedStatus === ExposedPromiseStatus.RESOLVED
  const rejectPredicate = expectedStatus === ExposedPromiseStatus.REJECTED
  const finallyPredicate =
    expectedStatus === ExposedPromiseStatus.RESOLVED ||
    expectedStatus === ExposedPromiseStatus.REJECTED

  const promises: Promise<any>[] = []
  promises.push(
    // Resolve
    new Promise((resolve, reject) => {
      exposed.promise
        .then((result) => {
          cancelTimeoutAndSettle(timeout, resolvePredicate ? resolve : reject)(result)
        })
        .catch(() => undefined)
      const timeout = global.setTimeout(() => {
        resolvePredicate ? reject() : resolve(undefined)
      }, WAIT_TIME)
    }).catch(() => undefined)
  )
  promises.push(
    // Reject
    new Promise((resolve, reject) => {
      exposed.promise.catch((result) => {
        cancelTimeoutAndSettle(timeout, rejectPredicate ? resolve : reject)(result)
      })
      const timeout = global.setTimeout(() => {
        ;rejectPredicate ? reject() : resolve(undefined)
      }, WAIT_TIME)
    }).catch(() => undefined)
  )
  promises.push(
    // Finally
    new Promise((resolve, reject) => {
      exposed.promise
        .catch(() => undefined)
        .finally(() => {
          cancelTimeoutAndSettle(timeout, finallyPredicate ? resolve : reject)()
        })
      const timeout = global.setTimeout(() => {
        ;finallyPredicate ? reject() : resolve(undefined)
      }, WAIT_TIME)
    }).catch(() => undefined)
  )

  return promises
}

describe(`ExposedPromise`, () => {
  it(`should create an empty ExposedPromise`, async () => {
    const exposed = new ExposedPromise()

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.PENDING)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.true
    expect(exposed.isResolved(), 'isResolved').to.be.false
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.false
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.PENDING)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, undefined, undefined])
  })

  it(`should correctly resolve an ExposedPromise`, async () => {
    const exposed = new ExposedPromise()
    const successMessage = 'success message!'
    exposed.resolve(successMessage)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.equal(successMessage)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal(['success message!', undefined, undefined])
  })

  it(`should create a resolved ExposedPromise when calling the static resolve`, async () => {
    const exposed = ExposedPromise.resolve(undefined)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, undefined, undefined])
  })

  it(`should create a resolved ExposedPromise when calling the static resolve with data`, async () => {
    const successMessage = 'success message!'
    const exposed = ExposedPromise.resolve(successMessage)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.equal(successMessage)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal(['success message!', undefined, undefined])
  })

  it(`should not change its state after it has been resolved`, async () => {
    const exposed = new ExposedPromise()
    const successMessage1 = 'success message!'
    const successMessage2 = 'success message!'
    exposed.resolve(successMessage1)
    exposed.resolve(successMessage2)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.equal(successMessage1)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal(['success message!', undefined, undefined])
  })

  it(`should not resolve a promise in an ExposedPromise`, async () => {
    const exposed = new ExposedPromise<Promise<string>>()
    const successMessage = 'success message!'
    exposed.resolve(Promise.resolve(successMessage))

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(await exposed.promiseResult, 'promiseResult').to.equal(successMessage)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal(['success message!', undefined, undefined])
  })

  it(`should resolve options.result immediately`, async () => {
    const successMessage = 'success message!'
    const exposed = ExposedPromise.resolve(successMessage)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.equal(successMessage)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal(['success message!', undefined, undefined])
  })

  it(`should resolve options.result (undefined) immediately`, async () => {
    const successMessage = undefined
    const exposed = ExposedPromise.resolve(successMessage)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.RESOLVED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.true
    expect(exposed.isRejected(), 'isRejected').to.be.false
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.equal(successMessage)
    expect(exposed.promiseError, 'promiseError').to.be.undefined
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.RESOLVED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, undefined, undefined])
  })

  it(`should correctly reject an ExposedPromise`, async () => {
    const exposed = new ExposedPromise()
    exposed.promise.catch(() => undefined) // We need to add a catch here or it will trigger an unhandled rejection error

    const failure = 'failure message!'
    exposed.reject(failure)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.REJECTED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.false
    expect(exposed.isRejected(), 'isRejected').to.be.true
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.equal(failure)
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.REJECTED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, 'failure message!', undefined])
  })

  it(`should not change its state after it has been rejected`, async () => {
    const exposed = new ExposedPromise()
    exposed.promise.catch(() => undefined) // We need to add a catch here or it will trigger an unhandled rejection error

    const failureMessage1 = 'failure message 1!'
    const failureMessage2 = 'failure message 2!'
    exposed.reject(failureMessage1)
    exposed.reject(failureMessage2)

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.REJECTED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.false
    expect(exposed.isRejected(), 'isRejected').to.be.true
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.equal(failureMessage1)
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.REJECTED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, 'failure message 1!', undefined])
  })

  it(`should reject options.reject immediately`, async () => {
    const failureMessage = 'failure message!'

    const exposed = ExposedPromise.reject<unknown>(failureMessage)
    exposed.promise.catch(() => undefined) // We need to add a catch here or it will trigger an unhandled rejection error

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.REJECTED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.false
    expect(exposed.isRejected(), 'isRejected').to.be.true
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.equal(failureMessage)
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.REJECTED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, 'failure message!', undefined])
  })

  it(`should reject options.reject (undefined) immediately`, async () => {
    const failureMessage = 'failure message!'

    const exposed = ExposedPromise.reject<unknown>(failureMessage)
    exposed.promise.catch(() => undefined) // We need to add a catch here or it will trigger an unhandled rejection error

    const promises = getExpectedPromiseOutcome(exposed, ExposedPromiseStatus.REJECTED)

    expect(exposed instanceof ExposedPromise, 'is instanceof ExposedPromise').to.be.true
    expect(exposed.isPending(), 'isPending').to.be.false
    expect(exposed.isResolved(), 'isResolved').to.be.false
    expect(exposed.isRejected(), 'isRejected').to.be.true
    expect(exposed.isSettled(), 'isSettled').to.be.true
    expect(typeof exposed.promise, 'promise').to.equal('object')
    expect(exposed.promiseResult, 'promiseResult').to.be.undefined
    expect(exposed.promiseError, 'promiseError').to.equal(failureMessage)
    expect(exposed.status, 'status').to.equal(ExposedPromiseStatus.REJECTED)
    expect(typeof exposed.resolve, 'resolve').to.equal('function')
    expect(typeof exposed.reject, 'reject').to.equal('function')
    expect(await Promise.all(promises)).to.deep.equal([undefined, 'failure message!', undefined])
  })
})
