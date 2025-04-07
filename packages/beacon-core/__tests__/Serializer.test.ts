// __tests__/utils/Serializer.test.ts

import { Serializer } from '../src/Serializer'
import bs58check from 'bs58check'

describe('Serializer', () => {
  let serializer: Serializer

  beforeEach(() => {
    serializer = new Serializer()
  })

  describe('serialize', () => {
    it('should serialize and bs58check encode an object', async () => {
      const obj = { foo: 'bar', num: 123 }
      const encoded = await serializer.serialize(obj)

      // Verify that the result is a string
      expect(typeof encoded).toBe('string')

      // Manually decode the string using bs58check to verify the JSON content
      const decodedBytes = bs58check.decode(encoded)
      const jsonString = Buffer.from(decodedBytes).toString('utf8')
      const decodedObj = JSON.parse(jsonString)

      expect(decodedObj).toEqual(obj)
    })
  })

  describe('deserialize', () => {
    it('should decode and deserialize a valid bs58check encoded string', async () => {
      const original = { hello: 'world', arr: [1, 2, 3] }
      // First serialize the object to get a valid encoded string
      const encoded = await serializer.serialize(original)
      const decodedObj = await serializer.deserialize(encoded)
      expect(decodedObj).toEqual(original)
    })

    it('should throw an error if the encoded payload is not a string', async () => {
      // Passing a non-string value should throw an error.
      await expect(serializer.deserialize(null as any)).rejects.toThrow(
        'Encoded payload needs to be a string'
      )
    })
  })
})
