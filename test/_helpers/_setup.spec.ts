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

mock
  .onGet('https://matrix.papers.tech/_matrix/client/versions')
  .reply(200, {
    versions: ['r0.0.1', 'r0.1.0', 'r0.2.0', 'r0.3.0', 'r0.4.0', 'r0.5.0'],
    unstable_features: {
      'm.lazy_load_members': true,
      'm.id_access_token': true,
      'm.require_identity_server': false,
      'm.separate_add_and_bind': true
    }
  })
  .onAny()
  .reply((config) => {
    console.log('UNMOCKED URL, RETURNING ERROR 500', config.url)

    return [500, {}]
  })
