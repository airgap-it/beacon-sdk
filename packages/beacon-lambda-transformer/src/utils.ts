import type { MichelsonJSON } from './typings'

export function buildContractAddress(address: string, entrypoint?: string) {
  return `${address}${entrypoint ? `%${entrypoint}` : ''}`
}

export function valueOrUnit(jsonValue?: MichelsonJSON): MichelsonJSON {
  return jsonValue || { prim: 'Unit' }
}

export function someOrNone(value?: MichelsonJSON): MichelsonJSON {
  return value ? { prim: 'Some', args: [value] } : { prim: 'None' }
}

export function buildStringPrim(str: string): MichelsonJSON {
  return { string: str }
}

export function buildIntPrim(str: string): MichelsonJSON {
  return { int: str }
}
