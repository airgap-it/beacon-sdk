// Shared utilities for Beacon SDK examples

window.BeaconUtils = {
  getSelectedNetwork() {
    const key = window.location.pathname.includes('wallet') ? 'walletSelectedNetwork' : 'selectedNetwork'
    return localStorage.getItem(key) || 'mainnet'
  },

  saveSelectedNetwork(network) {
    const key = window.location.pathname.includes('wallet') ? 'walletSelectedNetwork' : 'selectedNetwork'
    localStorage.setItem(key, network)
  },

  // Populate network dropdown based on selected blockchain
  populateNetworkSelect(networkSelectId = 'networkSelect', rpcInputId = 'customRpcUrl', customRpcContainerId = 'customRpcContainer') {
    const select = document.getElementById(networkSelectId)
    const rpcInput = document.getElementById(rpcInputId)
    const customRpcContainer = document.getElementById(customRpcContainerId)

    if (!select) return

    select.innerHTML = '' // Clear existing options

    // Show all networks including CUSTOM
    if (customRpcContainer) customRpcContainer.style.display = 'none'
    Object.values(beacon.NetworkType).forEach(network => {
      const option = document.createElement('option')
      option.value = network
      option.text = network.toUpperCase()
      select.appendChild(option)
    })

    // If CUSTOM is selected, show empty RPC input
    if (this.getSelectedNetwork() === beacon.NetworkType.CUSTOM) {
      if (customRpcContainer) customRpcContainer.style.display = 'block'
      if (rpcInput) {
        rpcInput.value = localStorage.getItem('tezosCustomRpcUrl') || ''
      }
    }

    // Set network value, defaulting to first option if stored value doesn't exist
    const storedNetwork = this.getSelectedNetwork()
    select.value = storedNetwork

    // If the stored value doesn't match any option, default to first option
    if (!select.value && select.options.length > 0) {
      select.value = select.options[0].value
      this.saveSelectedNetwork(select.value)
    }
  },

  // Get RPC URL based on network
  getRpcUrl(networkType, rpcInputValue) {
    const network = networkType ? networkType.toLowerCase() : this.getSelectedNetwork().toLowerCase()

    // For CUSTOM network, use the custom RPC input
    if (network === 'custom') {
      return rpcInputValue
    }

    // For standard Tezos networks, use tzkt RPC
    if (network === 'mainnet') {
      return 'https://rpc.tzkt.io/mainnet'
    } else {
      return `https://rpc.tzkt.io/${network}`
    }
  },

  // Get explorer URL for addresses
  async getExplorerUrlForAddress(address, networkType, client) {
    // If client has blockExplorer configured, use it
    if (client && client.blockExplorer) {
      return await client.blockExplorer.getAddressLink(address, { type: networkType || this.getSelectedNetwork() })
    }

    // For Tezos, use TzKT block explorer
    const explorer = new beacon.TzktBlockExplorer()
    return await explorer.getAddressLink(address, { type: networkType || this.getSelectedNetwork() })
  },

  // Get explorer URL for transaction hashes
  async getExplorerUrlForTransaction(transactionHash, networkType) {
    // For Tezos, use TzKT block explorer
    const explorer = new beacon.TzktBlockExplorer()
    return await explorer.getTransactionLink(transactionHash, { type: networkType || this.getSelectedNetwork() })
  },

  getStoredProtocolVersion() {
    const key = window.location.pathname.includes('wallet')
      ? 'beacon-wallet-protocol-version'
      : 'beacon-example-protocol-version'
    return localStorage.getItem(key) || '2'
  },

  applyProtocolVersion(version, { silent } = { silent: false }) {
    const isWallet = window.location.pathname.includes('wallet')
    const key = isWallet ? 'beacon-wallet-protocol-version' : 'beacon-example-protocol-version'
    const selectId = isWallet ? 'walletProtocolSelect' : 'protocolSelect'
    const logPrefix = isWallet ? '[perf][wallet]' : '[perf][dapp]'

    localStorage.setItem(key, version)

    if (typeof beacon.setPreferredMessageProtocolVersion === 'function') {
      beacon.setPreferredMessageProtocolVersion(version)
    }

    const select = document.getElementById(selectId)
    if (select) {
      select.value = version
    }

    if (!silent) {
      console.log(`${logPrefix} Preferred protocol version set to ${version}. Re-pair peers to apply if already connected.`)
    }
  },

  // Helper: Get current blockchain head level
  async getHeadLevel(rpcUrl) {
    const response = await fetch(`${rpcUrl}/chains/main/blocks/head/header`)
    const data = await response.json()
    return data.level
  },

  // Helper: Extract originated contract from operation
  extractOriginatedContract(operation) {
    for (const content of operation.contents || []) {
      if (content.kind === 'origination' && content.metadata?.operation_result) {
        const result = content.metadata.operation_result
        if (result.status === 'applied' && result.originated_contracts?.length > 0) {
          return result.originated_contracts[0]
        }
      }
    }
    return null
  },

  // Find originated contract from operation hash by searching recent blocks
  async findOriginatedContract(operationHash, rpcUrl, maxBlocks = 20) {
    try {
      const headLevel = await this.getHeadLevel(rpcUrl)

      // Search backwards through recent blocks
      for (let i = 0; i < maxBlocks; i++) {
        const blockLevel = headLevel - i

        try {
          const blockResponse = await fetch(`${rpcUrl}/chains/main/blocks/${blockLevel}?metadata=always`)
          const block = await blockResponse.json()

          // Search through all operations in the block
          for (const passOps of block.operations || []) {
            for (const op of passOps) {
              if (op.hash === operationHash) {
                const contractAddress = this.extractOriginatedContract(op)
                if (contractAddress) {
                  return contractAddress
                }
              }
            }
          }
        } catch (blockError) {
          // Silently continue on block fetch errors
          continue
        }
      }

      console.warn(`Operation ${operationHash} not found in last ${maxBlocks} blocks`)
      return null
    } catch (error) {
      console.error('Error searching for originated contract:', error)
      return null
    }
  },

  // Fetch balance from RPC
  async fetchBalance(address, networkType, rpcInputValue) {
    try {
      const rpcUrl = this.getRpcUrl(networkType, rpcInputValue)
      const response = await fetch(`${rpcUrl}/chains/main/blocks/head/context/contracts/${address}/balance`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const balanceText = await response.text()

      // Parse balance - response might be quoted string
      const balance = balanceText.replace(/"/g, '').trim()
      const balanceNum = parseInt(balance, 10)

      if (isNaN(balanceNum)) {
        return '—'
      }

      // Convert from mutez to tez
      const balanceInTez = (balanceNum / 1000000).toFixed(6)
      return `${balanceInTez} ꜩ`
    } catch (error) {
      console.error('Error fetching balance:', error)
      return '—'
    }
  },

  // Start balance refresh polling
  startBalanceRefresh(address, networkType, rpcInputValue, elementId, intervalMs = 5000) {
    // Set up interval to refresh balance
    const intervalId = setInterval(async () => {
      if (address) {
        const balance = await this.fetchBalance(address, networkType, rpcInputValue)
        const element = document.getElementById(elementId)
        if (element) {
          element.innerText = balance
        }
      }
    }, intervalMs)

    return intervalId
  },

  // Stop balance refresh polling
  stopBalanceRefresh(intervalId) {
    if (intervalId) {
      clearInterval(intervalId)
    }
  },

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