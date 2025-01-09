import React from 'react'
import { MergedWallet } from '../../utils/wallets'
import Wallet from '../wallet'

import { StorageKey } from '@airgap/beacon-types'
import { Grid2 } from '@mui/material'

interface TopWalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickLearnMore: () => void
  otherWallets?: { images: string[]; onClick: () => void }
  disabled?: boolean
  isMobile: boolean
}

const TopWallets: React.FC<TopWalletsProps> = (props: TopWalletsProps) => {
  const enableBugReport = localStorage ? localStorage.getItem(StorageKey.ENABLE_METRICS) : 'false'

  return (
    <Grid2 container justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
      <span>Connect Wallet</span>
      {enableBugReport === 'true' ? (
        <span style={{ fontSize: '12px' }}>
          Do you wish to report a bug?{' '}
          <span
            style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={props.onClickLearnMore}
          >
            Click here
          </span>
        </span>
      ) : (
        <span>
          If you don't have a wallet, you can select a provider and create one now.{' '}
          <span onClick={props.onClickLearnMore}>Learn more</span>
        </span>
      )}
      <Grid2
        container
        justifyContent={'center'}
        alignItems={'center'}
        rowSpacing={1}
        gap={0}
        columnSpacing={1}
      >
        {props.wallets.map((wallet) => (
          <Grid2 size={6}>
            <Wallet
              key={wallet.id}
              disabled={props.disabled}
              name={wallet.name}
              description={wallet.descriptions.join(' & ')}
              image={wallet.image}
              onClick={() => props.onClickWallet(wallet.id)}
            />
          </Grid2>
        ))}
        {props.otherWallets && (
          <Grid2 container onClick={props.otherWallets.onClick}>
            <Grid2 container>
              <h3 style={{ color: 'black' }}>Other Wallets</h3>
              <p>See other wallets you can use to connect</p>
            </Grid2>
            <Grid2 container>
              <img src={props.otherWallets.images[0]} alt="Other Wallet 1" />
              <img src={props.otherWallets.images[1]} alt="Other Wallet 2" />
              <img src={props.otherWallets.images[2]} alt="Other Wallet 3" />
            </Grid2>
          </Grid2>
        )}
      </Grid2>
    </Grid2>
  )
}

export default TopWallets
