import { AlertProps } from '../../ui/alert/common'
import { Modal, Box, Grid2, Button } from '@mui/material'
import { LeftIcon, LogoIcon, CloseIcon } from '../icons'
// import Loader from '../loader'
import useIsMobile from 'src/ui/alert/hooks/useIsMobile'

const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  const isMobile = useIsMobile()

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
          borderRadius: '30px',
          p: 4
        }}
      >
        <Grid2 container spacing={8} alignItems={'center'} justifyContent={'center'}>
          <Button variant="outlined">
            <LeftIcon />
          </Button>
          <LogoIcon />
          <Button variant="outlined" onClick={props.onCloseClick}>
            <CloseIcon />
          </Button>
        </Grid2>
        <Grid2 container>
          {props.content}
          {!isMobile && (
            <Grid2 container>
              {props.extraContent && <Grid2>---</Grid2>}
              {props.showMore && props.extraContent}
            </Grid2>
          )}
        </Grid2>
        {!isMobile && props.extraContent && (
          <Grid2
            style={{ cursor: 'pointer', justifyContent: 'center' }}
            onClick={() => props.onClickShowMore && props.onClickShowMore()}
            container
          >
            {props.showMore ? 'Show less' : 'Show more'}
          </Grid2>
        )}
      </Box>
    </Modal>
  )
}

export default Alert
