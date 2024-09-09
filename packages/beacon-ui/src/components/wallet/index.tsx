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
  console.log(props.name, props.tags)
  return (
    <Grid2 size={6} alignSelf={'baseline'}>
      <Button variant="outlined">
        <div style={{ padding: '10px' }}>
          <h3 style={{ margin: 0 }}>{props.name}</h3>
          {props.description && <p style={{ fontSize: '10px', margin: 0 }}>{props.description}</p>}
        </div>
        <img src={props.image} alt={`${props.name} logo`} width={50} height={50} />
      </Button>
    </Grid2>
  )
}

export default Wallet
