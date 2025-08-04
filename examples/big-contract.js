/**
 * Big Contract Generation Test
 * 
 * This file contains utilities to generate large contract operations for testing
 * the Beacon SDK's performance with big contracts.
 * 
 * The main function `generateBigContractOrigination` returns an object with:
 * - operationDetails: Array of operation details for the Beacon client
 * - metadata: Additional information about the generated contract
 */



/**
 * Generate a contract origination with big initial storage
 * @param {number} storageEntries - Number of storage entries to generate (default: 250)
 * @param {number} stringLength - Length of string values (default: 25)
 * @returns {Object} Contract origination data
 */
window.generateBigContractOrigination = function(storageEntries = 250, stringLength = 25) {
  console.log(`Generating big contract origination with ${storageEntries} storage entries and ${stringLength}-char strings...`)
  
  // Generate large initial storage 
  const generateLargeStorage = () => {
    // Generate the list entries properly
    const listEntries = Array.from({ length: storageEntries }, (_, i) => ({
      prim: 'Pair',
      args: [
        { int: i.toString() },
        { string: `initial_value_${i}_${'data'.repeat(stringLength)}` }
      ]
    }))
    
    // Simple storage: counter and list of entries
    const storage = {
      prim: 'Pair',
      args: [
        { int: '0' }, // counter
        listEntries  // list with many entries for size
      ]
    }
    
    return storage
  }
  
  // Simple contract code - just stores a counter and a list
  const contractCode = [
    {
      prim: 'parameter',
      args: [{ prim: 'nat' }]
    },
    {
      prim: 'storage',
      args: [
        {
          prim: 'pair',
          args: [
            { prim: 'nat' },
            {
              prim: 'list',
              args: [
                {
                  prim: 'pair',
                  args: [
                    { prim: 'nat' },
                    { prim: 'string' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      prim: 'code',
      args: [
        [
          // Simple contract: just return the storage unchanged
          // Stack starts: [(parameter, storage)]
          { prim: 'CDR' },          // Stack: [storage] - get storage, drop parameter
          { prim: 'NIL', args: [{ prim: 'operation' }] }, // Stack: [storage, []]
          { prim: 'PAIR' }          // Stack: [([],storage)]
        ]
      ]
    }
  ]
  
  const operationDetails = [
    {
      kind: window.beacon ? window.beacon.TezosOperationType.ORIGINATION : 'origination',
      fee: '50000',
      gas_limit: '100000',
      storage_limit: '60000',
      balance: '0',
      script: {
        code: contractCode,
        storage: generateLargeStorage()
      }
    }
  ]
  
  const approximateSize = JSON.stringify(operationDetails).length
  
  console.log(`Generated big contract origination with approximately ${approximateSize} bytes`)
  console.log('Origination structure:', JSON.stringify(operationDetails, null, 2))
  
  return {
    operationDetails,
    metadata: {
      type: 'big_contract_origination',
      approximateSize,
      numberOfStorageEntries: storageEntries,
      stringLength: stringLength,
      description: `Large contract origination for performance testing (${storageEntries} storage entries, ${stringLength}-char strings)`
    }
  }
}

console.log('Big contract generation utilities loaded successfully')
console.log('Available functions:')
console.log('- generateBigContractOrigination(storageEntries=250, stringLength=25): Creates a large contract origination')
console.log('Parameters:')
console.log('  - storageEntries: Number of storage entries to generate')
console.log('  - stringLength: Length of string values in each entry')