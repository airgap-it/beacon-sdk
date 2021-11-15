/* eslint-disable prefer-arrow/prefer-arrow-functions */

/**
 * A helper function to make sure if/elses and switch/cases are exhaustive
 *
 * @param empty The data that has to be empty
 */
export function assertNever(empty: never): never {
  return empty
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
