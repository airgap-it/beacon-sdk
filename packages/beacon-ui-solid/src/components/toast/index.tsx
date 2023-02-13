import { Component } from 'solid-js'
import Loader from '../loader'

export interface ToastProps {
  open: boolean
}

const Toast: Component<ToastProps> = (props: ToastProps) => {
  return (
    <div class={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}>
      <Loader />
      <p>Toast Example</p>
    </div>
  )
}

export default Toast
