import { Component } from 'solid-js'
import styles from './styles.css'

interface LoaderProps {}

const Alert: Component<LoaderProps> = (props: LoaderProps) => {
  return <div class="loader"></div>
}

export default Alert
