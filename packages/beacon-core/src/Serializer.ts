import bs58check from 'bs58check'
import { PROTOCOL_VERSION_V2, DEFAULT_PROTOCOL_VERSION } from './constants'

/**
 * @internalapi
 *
 * The Serializer handles message serialization/deserialization based on protocol version
 * - Protocol v1: Base58check encoding
 * - Protocol v2+: Plain JSON
 */
export class Serializer {
  private readonly protocolVersion: number

  constructor(protocolVersion: number = DEFAULT_PROTOCOL_VERSION) {
    this.protocolVersion = protocolVersion
  }

  /**
   * Serialize a message based on protocol version
   * @param message JSON object to serialize
   */
  public async serialize(message: unknown): Promise<string> {
    const str = JSON.stringify(message)

    if (this.protocolVersion >= PROTOCOL_VERSION_V2) {
      // v2+: Plain JSON
      return str
    } else {
      // v1: Base58check encoding
      return bs58check.encode(Buffer.from(str))
    }
  }

  /**
   * Deserialize a message based on protocol version
   * @param encoded String to be deserialized
   */
  public async deserialize(encoded: string): Promise<unknown> {
    if (typeof encoded !== 'string') {
      throw new Error('Encoded payload needs to be a string')
    }

    if (this.protocolVersion >= PROTOCOL_VERSION_V2) {
      // v2+: Plain JSON
      return JSON.parse(encoded)
    } else {
      // v1: Base58check decoding
      const decodedBytes = bs58check.decode(encoded)
      const jsonString = Buffer.from(decodedBytes).toString('utf8')
      return JSON.parse(jsonString)
    }
  }
}
