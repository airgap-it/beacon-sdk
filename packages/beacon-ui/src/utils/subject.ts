export class Subject<T> {
  private subscribers: ((value: T) => void)[] = []

  subscribe(callback: (value: T) => void): void {
    this.subscribers.push(callback)
  }

  next(value: T): void {
    this.subscribers.forEach((callback) => setTimeout(() => callback(value), 50))
  }
}
