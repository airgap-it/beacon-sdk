import * as bs58check from 'bs58check'

export class Serializer {
  public async serialize(message: unknown): Promise<string> {
    const str = JSON.stringify(message)

    return bs58check.encode(Buffer.from(str))
  }
  public async deserialize(encoded: string): Promise<unknown> {
    return JSON.parse(bs58check.decode(encoded))
  }
}
