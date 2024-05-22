export function serializable(data: any): any {
  return JSON.parse(JSON.stringify(data, function (key, value) {
    return Buffer.isBuffer(this[key]) 
      ? this[key].toString('hex')
      : this[key] instanceof ArrayBuffer
      ? Buffer.from(this[key]).toString('hex')
      : ArrayBuffer.isView(this[key])
      ? Buffer.from(this[key].buffer).toString('hex')
      : value
  }))
}