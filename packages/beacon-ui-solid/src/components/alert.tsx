import { Component } from 'solid-js'

export interface AlertProps {}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  return (
    <div>
      <h1>Alert Component</h1>
    </div>
  )
}

export default Alert
