/* eslint-disable prefer-arrow/prefer-arrow-functions */
import * as sodium from 'libsodium-wrappers'

export async function generateGUID(): Promise<string> {
  await sodium.ready
  const buf = sodium.randombytes_buf(16)

  return [buf.slice(0, 4), buf.slice(4, 6), buf.slice(6, 8), buf.slice(8, 10), buf.slice(10, 16)]
    .map(function (subbuf) {
      return Buffer.from(subbuf).toString('hex')
    })
    .join('-')
}

/* eslint-enable prefer-arrow/prefer-arrow-functions */
