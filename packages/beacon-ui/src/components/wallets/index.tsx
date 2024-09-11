import React from 'react'
import { MergedWallet } from '../../utils/wallets'
import Wallet from '../wallet'
import { Grid2 } from '@mui/material'

interface WalletProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickOther: () => void
  isMobile: boolean
  small?: boolean
  disabled?: boolean
}

const Wallets: React.FC<WalletProps> = (props: WalletProps) => {
  return (
    <Grid2 container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
      {props.wallets.map((wallet) => (
        <Wallet
          key={wallet.id}
          disabled={props.disabled}
          name={wallet.name}
          description={wallet.descriptions.join(' & ')}
          image={wallet.image}
          small={props.small}
          onClick={() => {
            props.onClickWallet(wallet.id)
          }}
        />
      ))}
      <button className="wallets-button" onClick={props.onClickOther}>
        {props.isMobile ? 'Pair wallet on another device' : 'Show QR code'}
      </button>
    </Grid2>
  )
}

export default Wallets
