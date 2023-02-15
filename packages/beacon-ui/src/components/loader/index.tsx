import { Component } from 'solid-js'
import styles from './styles.css'

interface LoaderProps {}

const Loader: Component<LoaderProps> = (_: LoaderProps) => {
  return <div class="loader"></div>
}

export { styles }
export default Loader
