import { AlertProps } from '../../ui/alert/common'
import { Modal, Box } from '@mui/material'

const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'black',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  }
  return (
    <Modal open={true} onClose={props.onCloseClick}>
      <Box sx={style}>
        <h1>Hello World</h1>
      </Box>
    </Modal>
  )
}

export default Alert
