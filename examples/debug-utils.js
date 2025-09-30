// Shared debug utilities for Beacon SDK examples

window.BeaconDebugUtils = {
  // Dump complete state for debugging
  async dumpState(type, client, extraInfo = {}) {
    console.log('='.repeat(80))
    console.log(`${type.toUpperCase()} STATE DUMP - ${new Date().toISOString()}`)
    console.log('='.repeat(80))

    try {
      // Basic info
      console.group('Basic Info')
      console.log('Page URL:', window.location.href)
      console.log('Page Type:', type)
      console.log('Beacon SDK Debug Enabled:', window.beaconSdkDebugEnabled)

      // Add any extra info passed in
      for (const [key, value] of Object.entries(extraInfo)) {
        console.log(`${key}:`, value)
      }
      console.groupEnd()

      // Client state
      console.group(`${type} Client State`)
      if (client) {
        console.log('Client initialized:', true)
        console.log('Client type:', client.constructor.name)

        if (client.name) console.log('Client name:', client.name)
        if (client.appUrl) console.log('Client app URL:', client.appUrl)

        // DApp-specific methods
        if (type === 'DApp' && client.getActiveAccount) {
          const activeAccount = await client.getActiveAccount()
          console.log('Active Account:', activeAccount || 'None')

          const allAccounts = await client.getAccounts()
          console.log('All Stored Accounts:', allAccounts)

          const colorMode = await client.getColorMode()
          console.log('Color Mode:', colorMode)
        }

        // Common methods
        if (client.getPeers) {
          const peers = await client.getPeers()
          console.log('Connected Peers:', peers)
        }

        // Transport and matrix status
        if (client._transport) {
          console.log('Transport:', client._transport)
        }

        if (client._matrix) {
          console.log('Matrix Client:', client._matrix)
        }
      } else {
        console.log('Client not initialized!')
      }
      console.groupEnd()

      // Storage state
      console.group('Local Storage')
      const storageKeys = Object.keys(localStorage).filter(key =>
        key.includes('beacon') ||
        key.includes('wallet') ||
        key.includes('dapp') ||
        key.includes('tezos') ||
        key.includes('tezlink') ||
        key.includes('protocol')
      )
      const storage = {}
      storageKeys.forEach(key => {
        let value = localStorage.getItem(key)
        // Try to parse JSON values for better display
        try {
          const parsed = JSON.parse(value)
          storage[key] = parsed
        } catch {
          storage[key] = value
        }
      })
      console.table(storage)
      console.groupEnd()

      // Session storage
      console.group('Session Storage')
      const sessionKeys = Object.keys(sessionStorage)
      const session = {}
      sessionKeys.forEach(key => {
        let value = sessionStorage.getItem(key)
        try {
          const parsed = JSON.parse(value)
          session[key] = parsed
        } catch {
          session[key] = value
        }
      })
      if (Object.keys(session).length > 0) {
        console.table(session)
      } else {
        console.log('No session storage data')
      }
      console.groupEnd()

      // IndexedDB databases
      console.group('IndexedDB')
      if (window.indexedDB) {
        try {
          const databases = await indexedDB.databases()
          console.log('Available databases:', databases)

          // Try to read beacon databases
          for (const db of databases) {
            if (db.name && (db.name.includes('beacon') || db.name.includes('wallet'))) {
              console.log(`Database: ${db.name} (version ${db.version})`)

              // Try to open and inspect the database
              try {
                const openedDb = await new Promise((resolve, reject) => {
                  const request = indexedDB.open(db.name, db.version)
                  request.onsuccess = () => resolve(request.result)
                  request.onerror = () => reject(request.error)
                })

                const objectStoreNames = Array.from(openedDb.objectStoreNames)
                console.log(`  Object stores in ${db.name}:`, objectStoreNames)

                openedDb.close()
              } catch (e) {
                console.log(`  Could not open database ${db.name}:`, e.message)
              }
            }
          }
        } catch (e) {
          console.log('Could not list databases:', e.message)
        }
      }
      console.groupEnd()

      // Network state
      console.group('Network State')
      console.log('Online:', navigator.onLine)
      console.log('Connection type:', navigator.connection?.effectiveType || 'Unknown')
      console.groupEnd()

      // WebSocket connections
      console.group('WebSocket Connections')
      if (window.performance && window.performance.getEntries) {
        const resources = window.performance.getEntriesByType('resource')
        const wsConnections = resources.filter(r => r.name.startsWith('ws://') || r.name.startsWith('wss://'))
        if (wsConnections.length > 0) {
          wsConnections.forEach(ws => {
            console.log('WebSocket:', ws.name, `(duration: ${ws.duration}ms)`)
          })
        } else {
          console.log('No WebSocket connections found')
        }
      }
      console.groupEnd()

      // Raw client object (be careful, might be large)
      console.group('Raw Client Object (Expanded)')
      console.dir(client, { depth: 3 })
      console.groupEnd()

      console.log('='.repeat(80))
      console.log(`${type.toUpperCase()} STATE DUMP COMPLETE`)
      console.log('='.repeat(80))

      alert(`${type} state dumped to console. Check browser DevTools console.`)
    } catch (error) {
      console.error('Error during state dump:', error)
      console.trace()
    }
  }
}