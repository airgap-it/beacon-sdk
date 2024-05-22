export function uint8ArrayFrom(value: string | Uint8Array | Buffer): Uint8Array {
  return typeof value === 'string' 
    ? isHex(value) 
      ? Buffer.from(value.replace(/^0x/, ''), 'hex') 
      : Buffer.from(value, 'utf-8')
    : value
}

export function isHex(value: string): boolean {
  return /^(0x)?[0-9a-fA-F]*$/.test(value)
}