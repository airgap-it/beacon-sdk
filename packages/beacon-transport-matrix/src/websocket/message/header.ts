export const EMPTY_ADDRESS = new Uint8Array(16)

export function createHeader(
  version: number,
  type: number,
  sender: Uint8Array,
  recipient: Uint8Array
): Buffer {
  const versionMask: number = version << 4
  const versionedType: Buffer = Buffer.alloc(1)
  versionedType.writeInt8(versionMask | type)

  return Buffer.concat([versionedType, sender, recipient])
}

export function extractVersion(bytes: Uint8Array): number | undefined {
  if (bytes.length === 0) {
    return undefined
  }

  return bytes.at(0)! >> 4
}

export function extractType(bytes: Uint8Array): number | undefined {
  if (bytes.length === 0) {
    return undefined
  }

  return bytes.at(0)! & 0x0f
}
