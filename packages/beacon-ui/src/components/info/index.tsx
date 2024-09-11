import React from 'react'

import { QRCodeIcon } from '../icons'
import { Button, Grid2 } from '@mui/material'

interface InfoProps {
  title: string
  description?: string
  data?: string
  icon?: any
  border?: boolean
  iconBadge?: boolean
  bigIcon?: boolean
  buttons?: {
    label: string
    type: 'primary' | 'secondary'
    onClick: () => void
  }[]
  downloadLink?: { url: string; label: string }
  onShowQRCodeClick?: (() => void) | (() => Promise<void>)
}

const Info: React.FC<InfoProps> = (props: InfoProps) => {
  return (
    <Grid2
      container
      justifyContent={'center'}
      alignItems={'center'}
      flexDirection={'column'}
      width={'100%'}
      sx={
        props.border
          ? {
              borderStyle: 'solid',
              borderWidth: 'thin',
              borderColor: 'black'
            }
          : undefined
      }
    >
      {props.icon && <Grid2 container>{props.icon}</Grid2>}
      <h3>{props.title}</h3>
      {props.description && <span>{props.description}</span>}
      {props.data && <pre>{props.data}</pre>}
      <Grid2 container>
        {props.buttons?.map((button, index) => (
          <Button key={index} onClick={button.onClick}>
            {button.label}
          </Button>
        ))}
      </Grid2>
      {props.downloadLink && <a href={props.downloadLink.url}>{props.downloadLink.label}</a>}
      {props.onShowQRCodeClick && (
        <Button id="qr-code-icon" onClick={props.onShowQRCodeClick}>
          <QRCodeIcon />
        </Button>
      )}
    </Grid2>
  )
}

export default Info
