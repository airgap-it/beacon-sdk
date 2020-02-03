import * as bs58check from 'bs58check'

export class Serializer {
  public serialize(message: unknown): string {
    const str = this.stringify(message)

    return bs58check.encode(Buffer.from(str))
  }
  public deserialize(encoded: string): unknown {
    return JSON.parse(bs58check.decode(encoded))
  }

  private stringify(message: unknown): string {
    return JSON.stringify(message, (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      } else {
        return value // Return everything else unchanged
      }
    })
  }
}
