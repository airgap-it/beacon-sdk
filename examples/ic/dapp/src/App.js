import { BeaconEvent, getDAppClientInstance, ICBlockchain, Regions, Serializer } from '@airgap/beacon-sdk';
import { useEffect, useState } from 'react';

import './App.css';

const client = getDAppClientInstance({
  name: 'Example DApp', // Name of the DApp,
  disclaimerText: 'This is an optional <b>disclaimer</b>.',
  appUrl: 'http://localhost:3000',
  featuredWallets: [],
  walletConnectOptions: {
    projectId: '97f804b46f0db632c52af0556586a5f3',
    relayUrl: 'wss://relay.walletconnect.com'
  },
  matrixNodes: {
    [Regions.EUROPE_WEST]: [
      'beacon-node-1.diamond.papers.tech',
      'beacon-node-1.sky.papers.tech',
      'beacon-node-2.sky.papers.tech',
      'beacon-node-1.hope.papers.tech',
      'beacon-node-1.hope-2.papers.tech',
      'beacon-node-1.hope-3.papers.tech',
      'beacon-node-1.hope-4.papers.tech',
      'beacon-node-1.hope-5.papers.tech'
    ],
    [Regions.NORTH_AMERICA_EAST]: []
  }
})

const icBlockchain = new ICBlockchain()
client.addBlockchain(icBlockchain)

function App() {
  const [activeAccount, setActiveAccount] = useState(undefined)
  const [dataToDeserialize, setDataToDeserialize] = useState('')
  const [dataToSerialize, setDataToSerialize] = useState('')

  useEffect(() => {
    const setInitialActiveAccount = async () => {
      const activeAccount = await client.getActiveAccount()
      setActiveAccount(activeAccount)
    }

    setInitialActiveAccount()
    
    client.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async () => {
      const activeAccount = await client.getActiveAccount()
      console.log('activeAccount', activeAccount)
      setActiveAccount(activeAccount)
    })
  }, [])

  const requestPermission = () => {
    client
      .permissionRequest({
        blockchainIdentifier: 'ic',
        blockchainData: {
          type: 'permission_request',
          networks: [{ type: 'mainnet' }],
          scopes: ['canister_call']
        }
      })
      .then((permissions) => {
        console.log('permissions', permissions)
      })
      .catch((error) => {
        console.log('requestPermission error', error)
      })
  }

  const sendToSelf = () => {
    client.request({
      blockchainIdentifier: 'ic',
      blockchainData: {
        type: 'canister_call_request',
        scope: 'canister_call',
        canisterId: '',
        method: '',
        args: ''
      }
    }).catch((error) => {
      console.log('sendToSelf error', error)
    })
  }

  const reset = () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  }

  const onDataToDeserializeInput = (event) => {
    setDataToDeserialize(event.target.value)
  }

  const deserializeData = () => {
    console.log('Deserializing:', dataToDeserialize)

    new Serializer().deserialize(dataToDeserialize).then(console.log).catch(console.error)
  }

  const onDataToSerializeInput = (event) => {
    setDataToSerialize(event.target.value)
  }

  const serializeData = () => {
    console.log('Serializing:', dataToSerialize)
    const parsed = JSON.parse(dataToSerialize)
    console.log(parsed)
    new Serializer().serialize(parsed).then(console.log).catch(console.error)
  }

  return (
    <div className="App">
      Beacon Example
      <br /><br />
      <span>
        Active account:
        <br />
        <span>{activeAccount?.chainData.account.owner}</span>
        <span>{activeAccount?.chainData.subaccount}</span>
        {/* <span>{activeAccount?.network.type}</span> */}
        <span>{activeAccount?.origin.type}</span>
      </span>
      <br /><br />
      <button onClick={requestPermission}>Request Permission</button>
      <br /><br />
      <button onClick={reset}>Reset and Refresh</button>
      <br /><br />
      <button onClick={sendToSelf}>Send 1 token to myself</button>
      <br /><br />
      ---
      <br /><br />
      <textarea onChange={onDataToDeserializeInput}></textarea>
      <button onClick={deserializeData}>Deserialize Data</button>
      <br /><br />
      ---
      <br /><br />
      <textarea onChange={onDataToSerializeInput}></textarea>
      <button onClick={serializeData}>Serialize Data</button>
      <br /><br />
    </div>
  );
}

export default App;
