/* eslint-disable prefer-arrow/prefer-arrow-functions */

export function keys<O extends object>(obj: O): (keyof O)[] {
  return Object.keys(obj) as (keyof O)[]
}
