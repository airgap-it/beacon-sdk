export function hexFrom(value: ArrayBuffer | Uint8Array | Buffer): string {
  const buffer: Buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return buffer.toString('hex')
}

export function hexTo(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'))
}
