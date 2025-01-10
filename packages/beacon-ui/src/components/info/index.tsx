import React from 'react'
import { QRCodeIcon } from '../icons'
import { Card, CardContent, CardActions, Button, Typography, Box } from '@mui/material'

interface InfoProps {
  icon?: React.ReactNode
  title: string
  description?: string
  data?: string
  border?: boolean
  buttons?: Array<{ label: string; onClick: () => void }>
  downloadLink?: { url: string; label: string }
  onShowQRCodeClick?: () => void
}

const Info: React.FC<InfoProps> = (props: InfoProps) => {
  const { icon, title, description, data, border, buttons, downloadLink, onShowQRCodeClick } = props

  console.log('border:', border)

  return (
    <Card
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <CardContent sx={{ width: '100%', textAlign: 'center' }}>
        {icon && (
          <Box display="flex" justifyContent="center" mb={1}>
            {icon}
          </Box>
        )}

        <Typography variant="h5" component="div" color="black" gutterBottom>
          {title}
        </Typography>

        {description && (
          <Typography variant="body1" mb={1}>
            {description}
          </Typography>
        )}

        {data && (
          <Box
            component="pre"
            sx={{
              textAlign: 'left',
              backgroundColor: '#f5f5f5',
              padding: 1,
              borderRadius: 1,
              overflowX: 'auto'
            }}
          >
            {data}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {buttons?.map((button, index) => (
          <Button key={index} onClick={button.onClick} sx={{ m: 0.5 }}>
            {button.label}
          </Button>
        ))}

        {downloadLink && (
          <Button
            component="a"
            href={downloadLink.url}
            sx={{ m: 0.5 }}
            target="_blank"
            rel="noopener"
          >
            {downloadLink.label}
          </Button>
        )}

        {onShowQRCodeClick && (
          <Button
            id="qr-code-icon"
            onClick={onShowQRCodeClick}
            startIcon={<QRCodeIcon />}
            sx={{ m: 0.5 }}
          >
            Show QR Code
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

export default Info
