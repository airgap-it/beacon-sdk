import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { Serializer } from '../../src/Serializer'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

const testCases = [
  {
    input: {
      a: true
    },
    output: 'nGZjrKZGLLn2B4R8hDg',
    reconstructed: {
      a: true
    }
  },
  {
    input: {
      key: 'this is some text',
      key2: 'and this is some other text',
      anotherKey: undefined
    },
    output:
      'H7MLDZDWEo4Qmsjyt1kFj4bHJP8ZbiRhceL1idsDSdLWfnemj1zn9VHdzeFF3ydRgqsCp3Vn6REtXCT7rLdcCSky9boXE',
    reconstructed: {
      key: 'this is some text',
      key2: 'and this is some other text'
    }
  },
  {
    input: {
      anotherKey: undefined,
      key2: 'and this is some other text',
      key: 'this is some text'
    },
    output:
      'H7MLDZDaRBLPsV7HZiaJ9A4SYkTwZ3fzkST3kRC5Mjue78QVVckfADYBuSHHT5Z787JVb3PeEzJkafPUyxJ15WEtLeTLN',
    reconstructed: {
      key: 'this is some text',
      key2: 'and this is some other text'
    }
  },
  {
    // Buffers cannot be serialized correctly
    input: {
      buffer: Buffer.from('test')
    },
    output: 'FifpQMzrRM6J9ouDgC1m8sq1Y8rY5kgZN3JTTFSeAi2nyCw1QrRZBzjXtW5i5imRvxbePcPgKRD537'
  }
  //   {
  //     input: {
  //       string: 'test',
  //       number: 123,
  //       boolean: true,
  //       undefined: undefined,
  //       null: null,
  //       bigint: BigInt('10000000000000000'),
  //       symbol: Symbol('Sym'),
  //       object: { test: 'text' },
  //       array: [0, 1, 2]
  //     },
  //     output:
  //       'KgUoa2zH4hL7Lf5gnuyF8EUt4yCUZJcmjspS72YyS5dwZs8yZ3Br6K3RH8FpGXx2cZWh8oTdGKLaUmar5vKrQ2Q5fNr6PGFKF16vuGuYufu48sGjtcNk8FboZkWk8BoUHyP3sfHa1mxs8ZGW2sauereug2evcvHLYo7NE6VSd9ZTS5XxGtQ',
  //     reconstructed: {
  //       string: 'test',
  //       number: 123,
  //       boolean: true,
  //       null: null,
  //       bigint: BigInt('10000000000000000'),
  //       object: { test: 'text' },
  //       array: [0, 1, 2]
  //     }
  //   }
]

describe(`serializer - Custom Tests`, () => {
  const serializer = new Serializer()
  testCases.forEach((testCase) => {
    it(`should serialize "${testCase.output}"`, async () => {
      const output = await serializer.serialize(testCase.input)
      expect(output).to.deep.equal(testCase.output)
    })

    it(`should deserialize "${testCase.output}"`, async () => {
      if (testCase.reconstructed) {
        const reconstructed = await serializer.deserialize(testCase.output)
        expect(reconstructed).to.deep.equal(testCase.reconstructed)
      }
    })
  })

  it(`should fail if invalid input is passed`, async () => {
    try {
      const deserialized = await serializer.deserialize({} as any)
      expect(deserialized).to.be.undefined
    } catch (e) {
      expect((e as any).message).to.equal(`Encoded payload needs to be a string`)
    }
  })
})
