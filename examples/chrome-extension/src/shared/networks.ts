/**
 * Network Configuration
 *
 * Defines known Tezos networks and their RPC endpoints.
 * Used for balance fetching and operation broadcasting.
 */

import type { NetworkConfig } from '../beacon/types'

export const KNOWN_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    type: 'mainnet',
    name: 'Mainnet',
    rpcUrl: 'https://mainnet.api.tez.ie'
  },
  ghostnet: {
    type: 'ghostnet',
    name: 'Ghostnet',
    rpcUrl: 'https://rpc.ghostnet.teztnets.com'
  },
  weeklynet: {
    type: 'weeklynet',
    name: 'Weeklynet',
    rpcUrl: 'https://rpc.weeklynet.teztnets.com'
  },
  custom: {
    type: 'custom',
    name: 'Custom',
    rpcUrl: ''
  }
}

export function resolveRpcUrl(network?: NetworkConfig | null): string {
  if (network?.rpcUrl) {
    return network.rpcUrl
  }

  if (network?.type && KNOWN_NETWORKS[network.type]?.rpcUrl) {
    return KNOWN_NETWORKS[network.type].rpcUrl as string
  }

  return KNOWN_NETWORKS.mainnet.rpcUrl as string
}

export function getExplorerUrl(address: string, networkType: string = 'mainnet'): string {
  switch (networkType) {
    case 'mainnet':
      return `https://tzkt.io/${address}`
    case 'ghostnet':
      return `https://ghostnet.tzkt.io/${address}`
    default:
      return `https://tzkt.io/${address}`
  }
}

export async function fetchBalance(address: string, network?: NetworkConfig): Promise<string> {
  const rpcUrl = resolveRpcUrl(network)

  try {
    const response = await fetch(`${rpcUrl}/chains/main/blocks/head/context/contracts/${address}/balance`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const balance = await response.text()
    // Balance is in mutez (1 tez = 1,000,000 mutez)
    const balanceNum = parseInt(balance.replace(/"/g, ''), 10)

    if (isNaN(balanceNum)) {
      return '0 XTZ'
    }

    const tez = balanceNum / 1_000_000
    return `${tez.toFixed(6)} XTZ`
  } catch (error) {
    console.error('Failed to fetch balance:', error)
    return 'Error'
  }
}
