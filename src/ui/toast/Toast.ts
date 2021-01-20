import { getColorMode } from '../../colorMode'
import { replaceInTemplate } from '../../utils/replace-in-template'
import { toastTemplates } from './toast-templates'

export interface ToastConfig {
  body: string
  timer?: number
  showLoader?: boolean
  showDoneButton?: boolean
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

let timeout: number | undefined

const getToastHTML = (config: ToastConfig): string => {
  const text = config.body
  console.log('text', text)

  let html = `<style>${toastTemplates.default.css}</style>${toastTemplates.default.html}`
  html = replaceInTemplate(html, 'text', text)

  return html
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    const elm = document.getElementById('beacon-toast')
    if (elm) {
      const animationDuration = 300

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      window.setTimeout(() => {
        const wrapper = document.getElementById('beacon-toast-wrapper')
        if (wrapper) {
          document.body.removeChild(wrapper)
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (toastConfig: ToastConfig): Promise<void> => {
  const timer = toastConfig.timer

  await closeToast()

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-toast-wrapper')
  wrapper.innerHTML = getToastHTML(toastConfig)

  if (timer) {
    timeout = window.setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  document.body.appendChild(wrapper)

  const colorMode = getColorMode()
  const elm = document.getElementById(`beacon-toast`)
  if (elm) {
    elm.classList.add(`theme__${colorMode}`)
  }

  const doneButton = document.getElementById('beacon-toast-button-done')

  if (doneButton) {
    doneButton.addEventListener('click', async () => {
      await closeToast()
    })
  }
}

export { closeToast, openToast }
