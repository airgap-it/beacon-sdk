export class Serializer {
  public serialize(message: unknown): string {
    return JSON.stringify(message)
  }
  public deserialize(encoded: string): unknown {
    return JSON.parse(encoded)
  }
}
