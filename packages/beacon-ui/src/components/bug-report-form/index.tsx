import { createEffect, createSignal } from 'solid-js'

const BugReportForm = () => {
  const [title, setTitle] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [steps, setSteps] = createSignal('')
  const [isFormValid, setFormValid] = createSignal(false)

  const isTitleValid = () => {
    return title().trim().length >= 10
  }

  const isDescriptionValid = () => {
    return description().trim().length >= 30
  }

  const areStepsValid = () => {
    return steps().trim().length >= 30
  }

  createEffect(() => {
    setFormValid(isTitleValid() && isDescriptionValid() && areStepsValid())
  })

  const handleSubmit = (event: Event) => {
    event.preventDefault()

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Specify the content type as JSON
      },
      body: JSON.stringify({
        title: title(),
        description: description(),
        steps: steps()
      }) // Convert the data object to JSON string
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
      })
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        console.error('Fetch error:', error)
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
          onChange={(e) => setTitle(e.currentTarget.value)}
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
          onChange={(e) => setDescription(e.currentTarget.value)}
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
          onChange={(e) => setSteps(e.currentTarget.value)}
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
