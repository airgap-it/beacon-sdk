export const checkInternetConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false
  }

  const nodes = [
    'https://beacon-node-1.diamond.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.sky.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-2.sky.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.hope.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.hope-2.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.hope-3.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.hope-4.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.hope-5.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.beacon-server-1.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.beacon-server-2.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.beacon-server-3.papers.tech/_synapse/client/beacon/info',
    'https://beacon-node-1.beacon-server-4.papers.tech/_synapse/client/beacon/info'
  ]

  for (const url of nodes) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch {}
  }

  return false
}
