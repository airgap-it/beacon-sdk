declare module 'bs58check' {
  export function encode(payload: Buffer | Uint8Array): string
  export function decode(payload: string): Buffer
  export function decodeUndafe(payload: string): Buffer
}
