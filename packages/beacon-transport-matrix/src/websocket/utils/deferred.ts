export class Deferred<T = void> {
    public readonly promise: Promise<T>

    public resolve!: (value: T | PromiseLike<T>) => void
    public reject!: (reason?: any) => void

    public constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}