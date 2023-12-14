import { createSignal } from 'solid-js'

const BugReportForm = () => {
  const [title, setTitle] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [steps, setSteps] = createSignal('')

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    // Handle form submission here
    console.log(title(), description(), steps())
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
        style={{
          padding: '10px 20px',
          'background-color': '#007bff',
          color: 'white',
          border: 'none',
          'border-radius': '5px',
          cursor: 'pointer',
          'margin-top': '20px'
        }}
      >
        Submit
      </button>
    </form>
  )
}

export default BugReportForm
