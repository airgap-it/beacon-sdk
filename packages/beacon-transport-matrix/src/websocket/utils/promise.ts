export async function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  const timeout: Promise<T> = new Promise<T>((_resolve, reject): void => {
    setTimeout(() => {
      reject(new Error('The execution timed out.'))
    }, ms)
  })

  return await Promise.race([promise, timeout])
}