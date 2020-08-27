import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

// import { DAppClient } from '../../src/clients/dapp-client/DAppClient'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

// describe(`serializer - Custom Tests`, () => {
//   const serializer = new Serializer()
//   testCases.forEach((testCase) => {
//     it(`should serialize "${testCase.output}"`, async () => {
//       const output = await serializer.serialize(testCase.input)
//       expect(output).to.deep.equal(testCase.output)
//     })

//     it(`should deserialize "${testCase.output}"`, async () => {
//       if (testCase.reconstructed) {
//         const reconstructed = await serializer.deserialize(testCase.output)
//         expect(reconstructed).to.deep.equal(testCase.reconstructed)
//       }
//     })
//   })
// })
