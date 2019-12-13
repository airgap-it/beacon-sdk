export class Serializer {
  public serialize(message: any): string {
    return JSON.stringify(message)
  }
  public deserialize(encoded: string): any {
    return JSON.parse(encoded)
  }
}
