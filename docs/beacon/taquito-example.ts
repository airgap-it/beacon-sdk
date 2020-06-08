import { NetworkType } from '@airgap/beacon-sdk'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { Tezos } from '@taquito/taquito'

const setup = async (): Promise<void> => {
  // Create a new BeaconWallet instance. The options will be passed to the DAppClient constructor.
  const wallet = new BeaconWallet({ name: 'Taquito DApp' })

  // Setting the wallet as the wallet provider for Taquito.
  Tezos.setWalletProvider(wallet)

  // Specify the network on which the permissions will be requested.
  const network = {
    type: NetworkType.CUSTOM,
    name: 'MyLocalNetwork',
    rpcUrl: `http://localhost:9732/`
  }

  // Send permission request to the connected wallet. This will either be the browser extension, or a wallet over the P2P network.
  await wallet.requestPermissions({ network })
}

const contractCall = async (): Promise<string> => {
  // Connect to a specific contract on the tezos blockchain.
  // Make sure the contract is deployed on the network you requested permissions for.
  const contract = await Tezos.wallet.at(
    'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn' // For this example, we use the TZBTC contract on mainnet.
  )
  // Call a method on a contract. In this case, we use the transfer entrypoint.
  // Taquito will automatically check if the entrypoint exists and if we call it with the right parameters.
  // In this case the parameters are [from, to, amount].
  // This will prepare the contract call and send the request to the connected wallet.
  const result = await contract.methods
    .transfer('tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7', 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT', 1)
    .send()

  // As soon as the operation is broadcast, you will receive the operation hash
  return result.opHash
}

const example = async (): Promise<void> => {
  // Set up beacon connection
  await setup()

  // Call the contract
  await contractCall()
}

example().catch(() => undefined)
