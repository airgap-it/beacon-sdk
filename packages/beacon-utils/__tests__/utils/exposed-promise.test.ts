import { ExposedPromise, ExposedPromiseStatus } from '../../src/utils/exposed-promise'

describe('ExposedPromise', () => {
  it('should have an initial status of pending', () => {
    const ep = new ExposedPromise()
    expect(ep.status).toBe(ExposedPromiseStatus.PENDING)
    expect(ep.isPending()).toBe(true)
    expect(ep.isSettled()).toBe(false)
  })

  it('should resolve with a value', async () => {
    const ep = new ExposedPromise<number>()
    ep.resolve(42)

    const result = await ep.promise
    expect(result).toBe(42)
    expect(ep.status).toBe(ExposedPromiseStatus.RESOLVED)
    expect(ep.isResolved()).toBe(true)
    expect(ep.promiseResult).toBe(42)
    expect(ep.isRejected()).toBe(false)
  })

  it('should reject with a reason', async () => {
    const ep = new ExposedPromise<number, string>()
    const errorReason = 'failure'
    ep.reject(errorReason)

    await expect(ep.promise).rejects.toEqual(errorReason)
    expect(ep.status).toBe(ExposedPromiseStatus.REJECTED)
    expect(ep.isRejected()).toBe(true)
    expect(ep.promiseError).toEqual(errorReason)
    expect(ep.isResolved()).toBe(false)
  })

  it('should not allow multiple resolutions', async () => {
    const ep = new ExposedPromise<number, string>()
    ep.resolve(1)
    // Calling resolve a second time has no effect.
    ep.resolve(2)
    // Even if reject is called after resolve, the state stays resolved.
    ep.reject('error')

    const result = await ep.promise
    expect(result).toBe(1)
    expect(ep.status).toBe(ExposedPromiseStatus.RESOLVED)
    expect(ep.promiseResult).toBe(1)
  })

  it('should not allow multiple rejections', async () => {
    const ep = new ExposedPromise<number, string>()
    ep.reject('error1')
    // Calling reject a second time, or resolve afterwards, has no effect.
    ep.reject('error2')
    ep.resolve(10)

    await expect(ep.promise).rejects.toEqual('error1')
    expect(ep.status).toBe(ExposedPromiseStatus.REJECTED)
    expect(ep.promiseError).toEqual('error1')
  })

  it('should create and resolve a static resolved promise', async () => {
    const ep = ExposedPromise.resolve('static success')
    const result = await ep.promise
    expect(result).toBe('static success')
    expect(ep.status).toBe(ExposedPromiseStatus.RESOLVED)
    expect(ep.promiseResult).toBe('static success')
  })

  it('should create and reject a static rejected promise', async () => {
    const ep = ExposedPromise.reject('static failure')
    await expect(ep.promise).rejects.toEqual('static failure')
    expect(ep.status).toBe(ExposedPromiseStatus.REJECTED)
    expect(ep.promiseError).toEqual('static failure')
  })
})
