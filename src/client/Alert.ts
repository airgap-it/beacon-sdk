import Swal, { SweetAlertOptions } from 'sweetalert2'

export const showAlert = (options: SweetAlertOptions): void => {
  Swal.fire(options)
    .then(sweetAlertResult => console.log(sweetAlertResult))
    .catch(sweetAlertError => console.error(sweetAlertError))
}
