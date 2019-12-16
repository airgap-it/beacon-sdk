let myWindow: any = {}
const cbs = [(_message: any) => {}]

myWindow.postMessage = message => {
  console.log('GOT POST MESSAGE', message)
  cbs.forEach(cb => {
    cb({ data: message })
  })
}

myWindow.addEventListener = (name, callback) => {
  console.log('addEventListener', name)
  cbs.push(callback)
}
console.log('before')

try {
  if (typeof window !== 'undefined') {
    myWindow = window
  }
} catch (e) {}

export default myWindow

console.log('after')
