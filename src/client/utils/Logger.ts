export class Logger {
  private readonly name: string

  constructor(service: string) {
    this.name = service
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(method: string, ...args: any[]): void {
    console.log(`[${this.name}](${method}):`, args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(method: string, ...args: any[]): void {
    this.log(method, args)
  }
}
