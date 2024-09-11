import { Button, Grid2 } from '@mui/material'
import React from 'react'

interface WalletProps {
  name: string
  image: string
  description?: string
  small?: boolean
  mobile?: boolean
  onClick: () => void
  tags?: string[]
  disabled?: boolean
}

const Wallet: React.FC<WalletProps> = (props: WalletProps) => {
  return (
    <Grid2 size={props.small ? undefined : 6} alignSelf={'baseline'}>
      <Button size={'small'} variant="outlined" onClick={props.onClick}>
        {!props.small && (
          <Grid2 container>
            <h3 style={{ margin: 0 }}>{props.name}</h3>
            {props.description && (
              <p style={{ fontSize: '10px', margin: 0 }}>{props.description}</p>
            )}
          </Grid2>
        )}
        <img
          src={props.image}
          alt={`${props.name} logo`}
          width={props.small ? 25 : 50}
          height={props.small ? 25 : 50}
        />
      </Button>
    </Grid2>
  )
}

export default Wallet
