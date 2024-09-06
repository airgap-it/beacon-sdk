import useWallets from '../../hooks/useWallets'

const PairingAlert = () => {
  const wallets = useWallets()
  return (
    <h1>
      {wallets.map((wallet, i) => (
        <div key={`${i}`}>{wallet.name}</div>
      ))}
    </h1>
  )
}

export default PairingAlert
