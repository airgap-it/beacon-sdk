import { IndexedDBStorage, SDK_VERSION } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { For, createEffect, createSignal } from 'solid-js'
import styles from './styles.css'
import { currentBrowser, currentOS } from '../../utils/platform'

interface StorageObject {
  [key: string]: string | null
}

interface BugReportRequest {
  userId: string
  title: string
  sdkVersion: string
  description: string
  steps: string
  os: string
  browser: string
  localStorage: string
  wcStorage: string
}

const BugReportForm = (props: any) => {
  const [title, setTitle] = createSignal('')
  const [titleTouched, setTitleTouched] = createSignal(false)
  const [titleErrorMsg, setTitleErrorMsg] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [descriptionTouched, setDescriptionTouched] = createSignal(false)
  const [descriptionErrorMsg, setDescriptionErrorMsg] = createSignal('')
  const [steps, setSteps] = createSignal('')
  const [stepsTouched, setStepsTouched] = createSignal(false)
  const [stepsErrorMsg, setStepsErrorMsg] = createSignal('')
  const [isFormValid, setFormValid] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(false)
  const [didUserAllow, setDidUserAllow] = createSignal(false)
  const [status, setStatus] = createSignal<'success' | 'error' | null>(null)
  const [showThankYou, setShowThankYou] = createSignal(false)

  const isTitleValid = () => {
    const check = title().replace(/ /gi, '').length > 10
    const invalidText = check ? '' : 'The title must be at least 10 characters long.'
    setTitleErrorMsg(invalidText)
    return check
  }

  const isDescriptionValid = () => {
    const check = description().replace(/ /gi, '').length >= 30
    const invalidText = check ? '' : 'The description must be at least 30 characters long.'
    setDescriptionErrorMsg(invalidText)
    return check
  }

  const areStepsValid = () => {
    const check = steps().replace(/ /gi, '').length >= 30
    const invalidText = check
      ? ''
      : 'Write at least 30 characters to describe the steps to reproduce.'
    setStepsErrorMsg(invalidText)
    return check
  }

  const indexDBToMetadata = async () => {
    const wcResult: StorageObject = {}
    const beaconResult: StorageObject = {}
    const db = new IndexedDBStorage('beacon', 'bug_report')

    try {
      const keys = (await db.getAllKeys()).map((key) => key.toString())
      for (const key of keys) {
        if (key.includes('beacon')) {
          beaconResult[key] = (await db.get(key as StorageKey)) as string
        } else {
          wcResult[key] = (await db.get(key as StorageKey)) as string
        }
      }
    } catch (error: any) {
      console.error(error.message)
    }

    if (
      (!beaconResult[StorageKey.USER_ID] || !beaconResult[StorageKey.USER_ID].length) &&
      localStorage
    ) {
      const key = Object.keys(localStorage).find((key) => key.includes('user-id'))
      key?.length && (beaconResult[StorageKey.USER_ID] = localStorage.getItem(key))
    }

    return [beaconResult, wcResult]
  }

  createEffect(() => {
    const titleValid = isTitleValid(),
      descriptionValid = isDescriptionValid(),
      stepsValid = areStepsValid(),
      userAllow = didUserAllow()
    setFormValid(titleValid && descriptionValid && stepsValid && userAllow)
  })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    setStatus(null)
    setShowThankYou(false)
    setIsLoading(true)

    const [beaconState, wcState] = await indexDBToMetadata()

    const request: BugReportRequest = {
      userId:
        beaconState[StorageKey.USER_ID] ?? localStorage.getItem(StorageKey.USER_ID) ?? 'UNKOWN',
      title: title(),
      sdkVersion: SDK_VERSION,
      description: description(),
      steps: steps(),
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(beaconState),
      wcStorage: JSON.stringify(wcState)
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }

    fetch('https://beacon-backend.prod.gke.papers.tech/bug-report/save', options)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        setStatus('success')
        setTimeout(() => setShowThankYou(true), 600)
        return response.json()
      })
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
        console.error('Error while sending report:', error.message)
        setStatus('error')
      })
      .then(() => {
        setIsLoading(false)
        setTimeout(() => {
          props.onSubmit()
        }, 5000)
      })
  }

  return (
    <form onSubmit={handleSubmit} class="form-style">
      <div class="input-group">
        <label for="title" class="label-style">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title()}
          onBlur={(e) => {
            !titleTouched() && setTitleTouched(true)
            setTitle(e.currentTarget.value)
          }}
          class={`input-style ${titleTouched() && titleErrorMsg().length ? 'invalid' : ''}`}
        />
        {titleTouched() && titleErrorMsg().length && (
          <label class="error-label">{titleErrorMsg()}</label>
        )}
      </div>
      <div class="input-group">
        <label for="description" class="label-style">
          Description
        </label>
        <textarea
          id="description"
          value={description()}
          onBlur={(e) => {
            !descriptionTouched() && setDescriptionTouched(true)
            setDescription(e.currentTarget.value)
          }}
          class={`textarea-style ${
            descriptionTouched() && descriptionErrorMsg().length ? 'invalid' : ''
          }`}
        />
        {descriptionTouched() && descriptionErrorMsg().length && (
          <label class="error-label">{descriptionErrorMsg()}</label>
        )}
      </div>
      <div class="input-group">
        <label for="steps" class="label-style">
          Steps to Reproduce
        </label>
        <textarea
          id="steps"
          value={steps()}
          onBlur={(e) => {
            !stepsTouched() && setStepsTouched(true)
            setSteps(e.currentTarget.value)
          }}
          class={`textarea-style ${stepsTouched() && stepsErrorMsg().length ? 'invalid' : ''}`}
        />
        {stepsTouched() && stepsErrorMsg().length && (
          <label class="error-label">{stepsErrorMsg()}</label>
        )}
      </div>
      <div class="permissions-group">
        <label for="user-premissions">You agree to share anonymous data with the developers.</label>
        <input
          id="user-premissions"
          type="checkbox"
          onChange={() => setDidUserAllow((prev) => !prev)}
        />
      </div>
      <button
        type="submit"
        disabled={!isFormValid()}
        class={`button-style ${isFormValid() ? 'valid' : 'invalid'} ${
          isLoading() ? 'button-loading' : ''
        }`}
      >
        {!isLoading() && !status() ? 'Submit' : <>&nbsp;</>}
        {!isLoading() && status() && (
          <span class={status() === 'success' ? 'icon success-icon' : 'icon error-icon'}>
            {status() === 'success' ? '✓' : '✕'}
          </span>
        )}
        {showThankYou() && (
          <div class="thank-you-message">
            <For each={'Thank You!'.split('')}>
              {(letter, index) => (
                <span style={{ 'animation-delay': `${index() * 0.1}s` }}>{letter}</span>
              )}
            </For>
          </div>
        )}
      </button>
    </form>
  )
}

export { styles }
export default BugReportForm
