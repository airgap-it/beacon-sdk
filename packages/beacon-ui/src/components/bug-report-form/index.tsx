import { IndexedDBStorage } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { createEffect, createSignal } from 'solid-js'

interface StorageObject {
  [key: string]: string | null
}

interface BugReportRequest {
  title: string
  description: string
  steps: string
  os: string
  browser: string
  localStorage: string
  wcStorage: string
}

const BugReportForm = (props: any) => {
  const [title, setTitle] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [steps, setSteps] = createSignal('')
  const [isFormValid, setFormValid] = createSignal(false)

  const isTitleValid = () => {
    return title().replace(/ /gi, '').length > 10
  }

  const isDescriptionValid = () => {
    return description().replace(/ /gi, '').length >= 30
  }

  const areStepsValid = () => {
    return steps().replace(/ /gi, '').length >= 30
  }

  const localStorageToMetadata = () => {
    const result: StorageObject = {}

    Object.keys(localStorage)
      .filter((key) => key.includes('beacon'))
      .forEach((key) => (result[key] = localStorage.getItem(key)))

    return result
  }

  const indexDBToMetadata = async () => {
    const result: StorageObject = {}
    const db = new IndexedDBStorage()

    if (!(await IndexedDBStorage.doesDatabaseAndTableExist())) {
      return result
    }

    try {
      await db.openDatabase()
      const keys = (await db.getAllKeys()).map((key) => key.toString())
      for (const key of keys) {
        result[key] = (await db.get(key as StorageKey)) as string
      }
    } catch (error: any) {
      console.error(error.message)
    }

    return result
  }

  const currentOS = () => {
    var ua = navigator.userAgent
    var osMap = new Map([
      ['Windows', 'Windows'],
      ['Macintosh', 'Mac OS'],
      ['Mac OS X', 'Mac OS X'],
      ['Linux', 'Linux'],
      ['Ubuntu', 'Ubuntu'],
      ['iPhone', 'iOS'],
      ['iPad', 'iOS'],
      ['Android', 'Android']
    ])

    for (let [key, value] of osMap) {
      if (ua.indexOf(key) !== -1) {
        return value
      }
    }
    return ua
  }

  const currentBrowser = () => {
    var ua = navigator.userAgent
    var browserMap = new Map([
      ['Firefox', 'Mozilla Firefox'],
      ['Opera', 'Opera'],
      ['OPR', 'Opera'],
      ['Trident', 'Microsoft Internet Explorer'],
      ['Edge', 'Microsoft Edge'],
      ['Chrome', 'Google Chrome'],
      ['Safari', 'Apple Safari']
    ])

    for (let [key, value] of browserMap) {
      if (ua.indexOf(key) !== -1) {
        return value
      }
    }
    return ua
  }

  createEffect(() => {
    setFormValid(isTitleValid() && isDescriptionValid() && areStepsValid())
  })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()

    const request: BugReportRequest = {
      title: title(),
      description: description(),
      steps: steps(),
      os: currentOS(),
      browser: currentBrowser(),
      localStorage: JSON.stringify(localStorageToMetadata()),
      wcStorage: JSON.stringify(await indexDBToMetadata())
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Specify the content type as JSON
      },
      body: JSON.stringify(request) // Convert the data object to JSON string
    }

    fetch('http://localhost:3000', options)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json() // Parse the response as JSON
      })
      .then((data) => {
        // Handle the response data here
        console.log(data)
        props.onSubmit()
      })
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        console.error('Fetch error:', error)
        props.onSubmit()
      })
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'max-width': '500px',
        'min-width': '100%',
        margin: '0 auto',
        gap: '20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'margin-bottom': '15px'
        }}
      >
        <label for="title" style={{ 'margin-bottom': '8px' }}>
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title()}
          onBlur={(e) => setTitle(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '10px',
            'box-sizing': 'border-box',
            border: '1px solid #ccc',
            'border-radius': '4px'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'margin-bottom': '15px'
        }}
      >
        <label for="description" style={{ 'margin-bottom': '8px' }}>
          Description
        </label>
        <textarea
          id="description"
          value={description()}
          onBlur={(e) => setDescription(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '10px',
            'box-sizing': 'border-box',
            border: '1px solid #ccc',
            'border-radius': '4px'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'margin-bottom': '15px'
        }}
      >
        <label for="steps" style={{ 'margin-bottom': '8px' }}>
          Steps to Reproduce
        </label>
        <textarea
          id="steps"
          value={steps()}
          onBlur={(e) => setSteps(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '10px',
            'box-sizing': 'border-box',
            border: '1px solid #ccc',
            'border-radius': '4px'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!isFormValid()}
        style={
          isFormValid()
            ? {
                padding: '10px 20px',
                'background-color': '#007bff',
                color: 'white',
                border: 'none',
                'border-radius': '5px',
                cursor: 'pointer',
                'margin-top': '20px'
              }
            : {
                padding: '10px 20px',
                'background-color': '#65afff',
                color: 'white',
                border: 'none',
                'border-radius': '5px',
                'margin-top': '20px'
              }
        }
      >
        Submit
      </button>
    </form>
  )
}

export default BugReportForm
