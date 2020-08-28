import { MockLocalStorage } from '../test-utils/MockLocalStorage'
;(global as any).localStorage = new MockLocalStorage()

require('jsdom-global')()
