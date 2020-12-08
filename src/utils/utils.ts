/* eslint-disable prefer-arrow/prefer-arrow-functions */

/**
 * A helper function to improve typings of object keys
 *
 * @param obj Object
 */
export function keys<O extends object>(obj: O): (keyof O)[] {
  return Object.keys(obj) as (keyof O)[]
}
