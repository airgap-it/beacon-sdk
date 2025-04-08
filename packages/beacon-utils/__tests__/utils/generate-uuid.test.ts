import { generateGUID } from '../../src/utils/generate-uuid' // Adjust the path as necessary

describe('generateGUID', () => {
  it('should return a string', async () => {
    const guid = await generateGUID()
    expect(typeof guid).toBe('string')
  })

  it('should return a valid GUID in the format 8-4-4-4-12 hexadecimal digits', async () => {
    const guid = await generateGUID()
    // Standard GUID regex (lowercase hex)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    expect(guid).toMatch(guidRegex)
  })

  it('should generate unique GUID values across multiple invocations', async () => {
    const generatedGuids = new Set<string>()
    const iterations = 10

    for (let i = 0; i < iterations; i++) {
      const guid = await generateGUID()
      generatedGuids.add(guid)
    }

    expect(generatedGuids.size).toBe(iterations)
  })
})
