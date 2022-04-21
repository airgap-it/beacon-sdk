import * as bs58check from 'bs58check'

/**
 * @internalapi
 *
 * The Serializer is used to serialize / deserialize JSON objects and encode them with bs58check
 */
export class Serializer {
  /**
   * Serialize and bs58check encode an object
   *
   * @param message JSON object to serialize
   */
  public async serialize(message: unknown): Promise<string> {
    const str = JSON.stringify(message)

    return bs58check.encode(Buffer.from(str))
  }

  /**
   * Deserialize a bs58check encoded string
   *
   * @param encoded String to be deserialized
   */
  public async deserialize(encoded: string): Promise<unknown> {
    if (typeof encoded !== 'string') {
      throw new Error('Encoded payload needs to be a string')
    }

    return JSON.parse(bs58check.decode(encoded).toString())
  }
}
