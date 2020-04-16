export abstract class BeaconError implements Error {
  name: string = 'ValidationError'
  public message: string

  constructor(public value: any, public token: Token, baseMessage: string) {
    const annot = this.token.annot()
    const annotText = annot ? `[${annot}] ` : ''
    this.message = `${annotText}${baseMessage}`
  }
}
export class ListValidationError extends TokenValidationError {
  name: string = 'ListValidationError'
  constructor(public value: any, public token: ListToken, message: string) {
    super(value, token, message)
  }
}
