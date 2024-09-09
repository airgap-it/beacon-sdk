import { AlertProps } from '../../ui/alert/common'
import { Modal, Box, Grid2, Button } from '@mui/material'
import { LeftIcon, LogoIcon, CloseIcon } from '../icons'
// import Loader from '../loader'
// import useIsMobile from 'src/ui/alert/hooks/useIsMobile'
import './styles.css'

const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  // const isMobile = useIsMobile()

  return (
    <Modal open={true} onClose={props.onCloseClick}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'grey',
          border: '2px solid #000',
          boxShadow: 24,
          borderRadius: '10px',
          p: 4
        }}
      >
        <Grid2 container spacing={8} alignItems={'center'} justifyContent={'center'}>
          <Button variant="outlined">
            <LeftIcon />
          </Button>
          <LogoIcon />
          <Button variant="outlined">
            <CloseIcon />
          </Button>
        </Grid2>
        <Grid2 container>{props.content}</Grid2>
      </Box>
    </Modal>
  )
}

export default Alert
