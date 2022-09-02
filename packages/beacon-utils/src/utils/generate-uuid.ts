/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { randomBytes } from '@stablelib/random'

/**
 * Generate a random GUID
 */
export async function generateGUID(): Promise<string> {
  const buf = randomBytes(16)

  return [buf.slice(0, 4), buf.slice(4, 6), buf.slice(6, 8), buf.slice(8, 10), buf.slice(10, 16)]
    .map(function (subbuf) {
      return Buffer.from(subbuf).toString('hex')
    })
    .join('-')
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
