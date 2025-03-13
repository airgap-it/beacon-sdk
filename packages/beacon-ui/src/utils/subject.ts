export interface Subscription {
  unsubscribe: () => void
}

export class Subject<T> {
  private subscribers: ((value: T) => void)[] = []

  subscribe(callback: (value: T) => void): Subscription {
    this.subscribers.push(callback)

    const unsubscribe = () => {
      this.unsubscribe(callback)
    }

    return { unsubscribe }
  }

  private unsubscribe(observer: Function): void {
    this.subscribers = this.subscribers.filter((subscriber) => subscriber !== observer)
  }

  next(value: T): void {
    this.subscribers.forEach((callback) => callback(value))
  }
}
