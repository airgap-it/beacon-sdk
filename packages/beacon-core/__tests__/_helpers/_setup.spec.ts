import { MockLocalStorage } from '../../../../test/test-utils/MockLocalStorage'
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

const getVersionReply = () => {
  return {
    versions: ['r0.0.1', 'r0.1.0', 'r0.2.0', 'r0.3.0', 'r0.4.0', 'r0.5.0'],
    unstable_features: {
      'm.lazy_load_members': true,
      'm.id_access_token': true,
      'm.require_identity_server': false,
      'm.separate_add_and_bind': true
    }
  }
}

const getLogin = (hostname: string) => {
  console.log('GET LOGIN')
  return {
    user_id: `@xxx:${hostname}`,
    access_token: 'ACCESS_TOKEN',
    home_server: hostname,
    device_id: 'xxx'
  }
}

const getSync = () => {
  return {
    account_data: {
      events: [
        {
          type: 'm.push_rules',
          content: {
            global: {
              underride: [
                {
                  conditions: [{ kind: 'event_match', key: 'type', pattern: 'm.call.invite' }],
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'ring' },
                    { set_tweak: 'highlight', value: false }
                  ],
                  rule_id: '.m.rule.call',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [
                    { kind: 'room_member_count', is: '2' },
                    { kind: 'event_match', key: 'type', pattern: 'm.room.message' }
                  ],
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'default' },
                    { set_tweak: 'highlight', value: false }
                  ],
                  rule_id: '.m.rule.room_one_to_one',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [
                    { kind: 'room_member_count', is: '2' },
                    { kind: 'event_match', key: 'type', pattern: 'm.room.encrypted' }
                  ],
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'default' },
                    { set_tweak: 'highlight', value: false }
                  ],
                  rule_id: '.m.rule.encrypted_room_one_to_one',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [{ kind: 'event_match', key: 'type', pattern: 'm.room.message' }],
                  actions: ['notify', { set_tweak: 'highlight', value: false }],
                  rule_id: '.m.rule.message',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [{ kind: 'event_match', key: 'type', pattern: 'm.room.encrypted' }],
                  actions: ['notify', { set_tweak: 'highlight', value: false }],
                  rule_id: '.m.rule.encrypted',
                  default: true,
                  enabled: true
                }
              ],
              sender: [],
              room: [],
              content: [
                {
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'default' },
                    { set_tweak: 'highlight' }
                  ],
                  pattern: '632392b258880b3a108035a4c847127544112102c5a0ffb07d459788f6f4be0e',
                  rule_id: '.m.rule.contains_user_name',
                  default: true,
                  enabled: true
                }
              ],
              override: [
                {
                  conditions: [],
                  actions: ['dont_notify'],
                  rule_id: '.m.rule.master',
                  default: true,
                  enabled: false
                },
                {
                  conditions: [
                    { kind: 'event_match', key: 'content.msgtype', pattern: 'm.notice' }
                  ],
                  actions: ['dont_notify'],
                  rule_id: '.m.rule.suppress_notices',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [
                    { kind: 'event_match', key: 'type', pattern: 'm.room.member' },
                    { kind: 'event_match', key: 'content.membership', pattern: 'invite' },
                    {
                      kind: 'event_match',
                      key: 'state_key',
                      pattern:
                        '@632392b258880b3a108035a4c847127544112102c5a0ffb07d459788f6f4be0e:beacon-node-0.papers.tech:8448'
                    }
                  ],
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'default' },
                    { set_tweak: 'highlight', value: false }
                  ],
                  rule_id: '.m.rule.invite_for_me',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [{ kind: 'event_match', key: 'type', pattern: 'm.room.member' }],
                  actions: ['dont_notify'],
                  rule_id: '.m.rule.member_event',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [{ kind: 'contains_display_name' }],
                  actions: [
                    'notify',
                    { set_tweak: 'sound', value: 'default' },
                    { set_tweak: 'highlight' }
                  ],
                  rule_id: '.m.rule.contains_display_name',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [
                    { kind: 'event_match', key: 'content.body', pattern: '@room' },
                    { kind: 'sender_notification_permission', key: 'room' }
                  ],
                  actions: ['notify', { set_tweak: 'highlight', value: true }],
                  rule_id: '.m.rule.roomnotif',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [
                    { kind: 'event_match', key: 'type', pattern: 'm.room.tombstone' },
                    { kind: 'event_match', key: 'state_key', pattern: '' }
                  ],
                  actions: ['notify', { set_tweak: 'highlight', value: true }],
                  rule_id: '.m.rule.tombstone',
                  default: true,
                  enabled: true
                },
                {
                  conditions: [{ kind: 'event_match', key: 'type', pattern: 'm.reaction' }],
                  actions: ['dont_notify'],
                  rule_id: '.m.rule.reaction',
                  default: true,
                  enabled: true
                }
              ]
            },
            device: {}
          }
        }
      ]
    },
    to_device: { events: [] },
    device_lists: { changed: [], left: [] },
    presence: { events: [] },
    rooms: { join: {}, invite: {}, leave: {} },
    groups: { join: {}, invite: {}, leave: {} },
    device_one_time_keys_count: {},
    next_batch: 's949223_5360456_0_1_1_1_1_68957_1'
  }
}

mock
  .onGet('https://beacon-node-1.sky.papers.tech/_matrix/client/versions')
  .reply(200, getVersionReply())
  .onGet('https://beacon-node-2.sky.papers.tech/_matrix/client/versions')
  .reply(200, getVersionReply())
  .onGet('https://beacon-node-0.papers.tech:8448/_matrix/client/versions')
  .reply(200, getVersionReply())
  .onPost('https://beacon-node-1.sky.papers.tech/_matrix/client/r0/login')
  .reply(200, getLogin('beacon-node-1.sky.papers.tech'))
  .onPost('https://beacon-node-2.sky.papers.tech/_matrix/client/r0/login')
  .reply(200, getLogin('beacon-node-2.sky.papers.tech'))
  .onPost('https://beacon-node-0.papers.tech:8448/_matrix/client/r0/login')
  .reply(200, getLogin('beacon-node-0.papers.tech:8448'))
  .onGet('https://beacon-node-1.sky.papers.tech/_matrix/client/r0/sync')
  .reply(200, getSync())
  .onGet('https://beacon-node-2.sky.papers.tech/_matrix/client/r0/sync')
  .reply(200, getSync())
  .onGet('https://beacon-node-0.papers.tech:8448/_matrix/client/r0/sync')
  .reply(200, getSync())
  .onAny()
  .reply((config: any) => {
    console.log('UNMOCKED URL, RETURNING ERROR 500', `${config.baseURL}${config.url}`)

    return [500, {}]
  })
