import React from 'react'
import { MergedWallet } from '../../utils/wallets'
import Wallet from '../wallet'
import { Button, Grid2 } from '@mui/material'

interface WalletProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickOther: () => void
  isMobile: boolean
  small?: boolean
  disabled?: boolean
}

const Wallets: React.FC<WalletProps> = (props: WalletProps) => {
  const wallets = props.wallets.map((wallet) => (
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
  ))
  const groupedElements = []

  for (let i = 0; i < wallets.length; i += 4) {
    groupedElements.push(wallets.slice(i, i + 4))
  }

  return (
    <Grid2 container sx={{ justifyContent: 'center' }}>
      <Grid2 container spacing={2} sx={{ flexFlow: 'column', padding: '20px' }}>
        {groupedElements.map((group, groupIndex) => (
          <Grid2 container spacing={2} key={groupIndex}>
            {group.map((item, itemIndex) => (
              <Grid2 size={3} key={itemIndex}>
                {/* Replace this with your content for each item */}
                {item}
              </Grid2>
            ))}
          </Grid2>
        ))}
      </Grid2>
      <Button onClick={props.onClickOther} variant="outlined" sx={{ width: '100%' }}>
        {props.isMobile ? 'Pair wallet on another device' : 'Show QR code'}
      </Button>
    </Grid2>
  )
}

export default Wallets
