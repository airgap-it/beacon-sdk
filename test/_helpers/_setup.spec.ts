import { MockLocalStorage } from '../test-utils/MockLocalStorage'
;(global as any).localStorage = new MockLocalStorage()

// require('jsdom-global')()

const { JSDOM } = require('jsdom')
new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/'
})
