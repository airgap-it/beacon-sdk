import React from 'react'
import { Card, CardActionArea, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material'

export interface WalletProps {
  name: string
  image: string
  description?: string
  small?: boolean
  mobile?: boolean
  onClick: () => void
  tags?: string[]
  disabled?: boolean
}

const Wallet: React.FC<WalletProps> = (props) => {
  const { name, image, description, small, mobile, onClick, tags, disabled } = props

  // Common styling
  const cardStyles = {
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    maxWidth: mobile ? 30 : 200,
    margin: '0.5rem'
  }

  if (!small) {
    // Main view
    return (
      <Card sx={{ ...cardStyles, maxHeight: mobile ? 30 : 88, minHeight: mobile ? 30 : 88 }}>
        <CardActionArea onClick={onClick} disabled={disabled}>
          <Box display="flex" flexDirection="row">
            <CardContent sx={{ flex: '1 1 auto' }}>
              <Typography sx={{ fontSize: '1.2rem', color: 'black' }}>{name}</Typography>
              {description && (
                <Typography sx={{ marginTop: 0.5, fontSize: '0.63rem' }}>{description}</Typography>
              )}
              {tags && tags.length > 0 && (
                <Box display="flex" gap={1} flexWrap="wrap" marginTop={1}>
                  {tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              )}
            </CardContent>
            <CardMedia
              component="img"
              image={image}
              alt={name}
              sx={{
                width: 60,
                height: 60,
                objectFit: 'contain',
                alignSelf: 'center',
                marginRight: 2,
                overflow: 'auto'
              }}
            />
          </Box>
        </CardActionArea>
      </Card>
    )
  }

  // Small view
  return (
    <Box>
      <Card sx={{ ...cardStyles, width: 62, height: 62, maxWidth: 62, maxHeight: 62 }}>
        <CardActionArea onClick={onClick} disabled={disabled}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CardMedia
              component="img"
              image={image}
              alt={name}
              sx={{ width: 30, height: 30, maxWidth: 30, maxHeight: 30, objectFit: 'contain' }}
            />
          </CardContent>
        </CardActionArea>
      </Card>
      <Typography sx={{ marginTop: 1 }}>{name}</Typography>
    </Box>
  )
}

export default Wallet
