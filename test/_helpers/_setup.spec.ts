import { MockLocalStorage } from '../test-utils/MockLocalStorage'
;(global as any).localStorage = new MockLocalStorage()

import Axios from 'axios'
const MockAdapter = require('axios-mock-adapter')

beforeEach(() => {
  ;(global as any).localStorage.clear()
})

/**
 * Create a JSDOM instance to support localStorage and other DOM methods
 */
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/'
})

;(global as any).window = dom.window
;(global as any).document = dom.window.document

// This sets the mock adapter on the default instance
const mock = new MockAdapter(Axios)

mock.onAny().reply((config) => {
  console.log('UNMOCKED URL, RETURNING ERROR 500', config.url)

  return [500, {}]
})
