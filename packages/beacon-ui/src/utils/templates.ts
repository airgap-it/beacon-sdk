import {
  createSanitizedElement,
  createSVGElement,
  createSVGGElement,
  createSVGPathElement
} from './html-elements'

export const constructToastContainer = (elements: HTMLElement[]): HTMLElement => {
  return createSanitizedElement(
    'div',
    ['beacon-toast__base', 'animated', 'fadeIn'],
    [['id', 'beacon-toast']],
    [
      createSanitizedElement(
        'div',
        ['beacon-toast__content'],
        [],
        [
          createSanitizedElement(
            'span',
            [],
            [['id', 'beacon-text']],
            [
              createSanitizedElement('p', [], [['id', 'beacon-text-content']], elements),
              createSanitizedElement(
                'a',
                ['beacon-toast__wallet__link'],
                [['id', 'beacon-open-wallet']],
                [
                  createSanitizedElement('span', [], [], 'Open'),
                  createSVGElement(
                    ['svg-inline--fa', 'fa-external-link-alt', 'fa-w-16'],
                    [
                      ['aria-hidden', 'true'],
                      ['focusable', 'false'],
                      ['data-prefix', 'fas'],
                      ['data-icon', 'external-link-alt'],

                      ['role', 'img'],
                      ['xmlns', 'http://www.w3.org/2000/svg'],
                      ['viewBox', '0 0 512 512']
                    ],
                    [
                      createSVGPathElement([
                        ['fill', 'currentColor'],
                        [
                          'd',
                          'M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z'
                        ]
                      ])
                    ]
                  )
                ]
              )
            ]
          ),
          createSVGElement(
            ['beacon-toast__more', 'svg-inline--fa', 'fa-angle-down', 'fa-w-10'],
            [
              ['id', 'beacon-toast-button-expand'],
              ['aria-hidden', 'true'],
              ['focusable', 'false'],
              ['data-prefix', 'fas'],
              ['data-icon', 'angle-down'],

              ['role', 'img'],
              ['xmlns', 'http://www.w3.org/2000/svg'],
              ['viewBox', '0 0 320 512']
            ],
            [
              createSVGPathElement([
                ['fill', 'currentColor'],
                [
                  'd',
                  'M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z'
                ]
              ])
            ]
          ),
          createSVGElement(
            ['beacon-toast__more', 'svg-inline--fa', 'fa-times', 'fa-w-10'],
            [
              ['id', 'beacon-toast-button-close'],
              ['aria-hidden', 'true'],
              ['focusable', 'false'],
              ['data-prefix', 'fal'],
              ['data-icon', 'times'],
              ['role', 'img'],
              ['xmlns', 'http://www.w3.org/2000/svg'],
              ['viewBox', '0 0 320 512']
            ],
            [
              createSVGPathElement([
                ['fill', 'currentColor'],
                [
                  'd',
                  'M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z'
                ]
              ])
            ]
          )
        ]
      ),
      createSanitizedElement('div', ['progress-line'], [['id', 'beacon-toast-loader']], ''),
      createSanitizedElement('hr', ['hide'], [['id', 'beacon-toast-loader-placeholder']], ''),
      createSanitizedElement(
        'div',
        ['beacon-toast__more--action'],
        [['id', 'beacon-toast-list']],
        ''
      )
    ]
  )
}

export const constructPoweredByBeacon = (): HTMLElement => {
  return createSanitizedElement(
    'a',
    [],
    [
      ['href', 'https://walletbeacon.io'],
      ['target', '_blank']
    ],
    [
      document.createTextNode('powered by'),
      createSVGElement(
        [],
        [
          ['id', 'f63e95a9-fd19-4487-bc1a-09eb2f066704'],
          ['data-name', 'Guides'],
          ['xmlns', 'http://www.w3.org/2000/svg'],
          ['width', '65'],
          ['height', '65'],
          ['viewBox', '0 0 65 65']
        ],
        [
          createSanitizedElement('title', [], [], 'beacon_logo'),
          createSVGPathElement([
            ['fill', 'currentColor'],
            [
              'd',
              'M59.66,29.52v1.06c0,.37-.18,9.07-4.11,15.88S44.16,57.75,43.84,57.93l-.91.54-1.61-.93-9.19-5.3a14.68,14.68,0,0,1-1.63-1.06h0a14.09,14.09,0,0,1-1.29-1,17.63,17.63,0,0,1-2.56-2.7,18.58,18.58,0,0,1-2.56-4.51,21.53,21.53,0,0,1-1.5-9,6.21,6.21,0,0,1,2.93-.73c.25,0,.49,0,.74,0a18.29,18.29,0,0,0,1,7.93,15.06,15.06,0,0,0,6.67,8l8.93,5.16c.2-.13.43-.3.68-.48,2.26-1.6,6.42-4.92,8.86-9.13C55.12,39.94,55.8,34,56,31.57l-3.79-2.19a23,23,0,0,0,.6-3.83Z'
            ]
          ]),
          createSVGPathElement([
            ['fill', 'currentColor'],
            [
              'd',
              'M49.22,11.43V23.89c0,.65,0,1.3-.1,1.94v0c-.06.55-.13,1.1-.24,1.63A18,18,0,0,1,47.82,31a19.11,19.11,0,0,1-2.62,4.49,21.37,21.37,0,0,1-7.07,5.8,6.08,6.08,0,0,1-2.42-2.84A18.1,18.1,0,0,0,42,33.7h0a15.12,15.12,0,0,0,3.58-9.81V13.6c-.21-.11-.47-.21-.74-.35-2.52-1.16-7.47-3.1-12.36-3.1-5.42,0-11,2.4-13.08,3.45V18a22.54,22.54,0,0,0-3.63,1.38V11.43l.92-.52c.33-.18,8-4.38,15.79-4.38s15.48,4.2,15.8,4.38Z'
            ]
          ]),
          createSVGPathElement([
            ['fill', 'currentColor'],
            [
              'd',
              'M18,26.4,9,31.55q0,.35.06.78a31.63,31.63,0,0,0,3.49,12.28c2.71,4.71,7.55,8.3,9.53,9.64l3.79-2.19a23.33,23.33,0,0,0,3,2.44l-6.88,4-.92-.54c-.31-.18-7.75-4.69-11.68-11.5S5.36,30.92,5.35,30.56V29.49L7,28.55l9.17-5.29c.57-.32,1.14-.61,1.72-.87a13.46,13.46,0,0,1,1.55-.61A17.52,17.52,0,0,1,23,20.91a19.2,19.2,0,0,1,5.19,0,21.49,21.49,0,0,1,8.55,3.24,6.29,6.29,0,0,1-1.25,3.51,17.9,17.9,0,0,0-7.3-3.06A15.14,15.14,0,0,0,18,26.4Z'
            ]
          ])
        ]
      ),
      document.createTextNode('Beacon')
    ]
  )
}

export const constructAlertContainer = (
  id: string,
  callToAction: HTMLElement[],
  buttons: HTMLElement[],
  main: HTMLElement[]
): HTMLElement => {
  return createSanitizedElement(
    'div',
    ['beacon-alert__base', 'animated', 'fadeIn'],
    [['id', `beacon-alert-modal-${id}`]],
    [
      createSanitizedElement(
        'div',
        ['beacon-modal__wrapper'],
        [],
        [
          createSanitizedElement(
            'div',
            ['beacon-modal__header'],
            [],
            [
              createSVGElement(
                [],
                [
                  ['xmlns', 'http://www.w3.org/2000/svg'],
                  ['id', 'Guides'],
                  ['x', '0'],
                  ['y', '0'],
                  ['version', '1.1'],
                  ['viewBox', '0 0 179.2 43'],
                  ['xml:space', 'preserve'],
                  ['width', '140'],
                  ['height', '40']
                ],
                [
                  createSanitizedElement(
                    'style',
                    [],
                    [],
                    `.st0 {
                    fill: #3880ff;
                  }
                  .st1 {
                    fill: #fff;
                  }`
                  ),
                  createSVGPathElement([
                    [
                      'd',
                      'M45 19v.9c0 .3-.2 7.5-3.4 13.2-3.3 5.6-9.4 9.3-9.7 9.5l-.8.4-1.3-.8-7.6-4.4c-.5-.3-.9-.6-1.4-.9-.4-.3-.7-.5-1.1-.8-.8-.7-1.5-1.4-2.1-2.2-.9-1.1-1.6-2.4-2.1-3.7-.9-2.3-1.3-4.8-1.2-7.5.8-.4 1.6-.6 2.4-.6h.6c-.2 2.4.1 4.6.8 6.6 1 2.8 2.9 5.1 5.5 6.6l7.4 4.3c.2-.1.4-.2.6-.4 1.9-1.3 5.3-4.1 7.3-7.6 2.2-3.9 2.8-8.9 3-10.8L38.8 19c.3-1 .4-2.1.5-3.2L45 19z'
                    ],
                    ['class', 'st0']
                  ]),
                  createSVGPathElement([
                    [
                      'd',
                      'M36.3 4.1v10.3c0 .5 0 1.1-.1 1.6s-.1.9-.2 1.3c-.2 1-.5 2-.9 3-.5 1.3-1.3 2.6-2.2 3.7-1.5 1.9-3.5 3.6-5.9 4.8-.9-.6-1.6-1.3-2-2.4 2.1-1 3.9-2.3 5.2-4 1.9-2.3 3-5.1 3-8.1V5.9l-.6-.3c-2-1-6.1-2.6-10.1-2.6-4.5 0-9.1 2-10.9 2.9v3.6c-1 .3-2 .7-3 1.1V4.1l.8-.4C9.7 3.5 16 0 22.5 0s12.8 3.5 13.1 3.6l.7.5z'
                    ],
                    ['class', 'st0']
                  ]),
                  createSVGPathElement([
                    [
                      'd',
                      'M10.5 16.5l-7.4 4.3v.7c.2 2.1.9 6.5 2.9 10 2.2 3.9 6.2 6.9 7.9 8l3.1-1.8c.8.7 1.6 1.4 2.5 2L13.8 43l-.8-.5c-.3-.2-6.4-3.9-9.7-9.5C.1 27.4 0 20.2 0 19.9V19l1.3-.8L9 13.9c.5-.3.9-.5 1.4-.7.4-.2.8-.4 1.3-.5 1-.4 2-.6 3-.7 1.4-.2 2.9-.2 4.3 0 2.4.3 4.8 1.2 7.1 2.7 0 1-.4 2-1 2.9-1.9-1.3-4-2.2-6-2.5-3.1-.6-6-.1-8.6 1.4z'
                    ],
                    ['class', 'st0']
                  ]),
                  createSVGGElement([
                    createSVGPathElement([
                      [
                        'd',
                        'M73.9 23c.9 1 1.3 2.3 1.3 3.7 0 1.9-.6 3.4-1.9 4.5-1.3 1.1-3.1 1.7-5.5 1.7h-8.6v-23h8.4c2.3 0 4.1.5 5.3 1.5 1.2 1 1.8 2.4 1.8 4.2 0 1.5-.4 2.7-1.2 3.6-.8.9-1.8 1.5-3.1 1.8 1.5.3 2.6 1 3.5 2zm-11.7-3h5c1.5 0 2.6-.3 3.4-1 .8-.7 1.2-1.6 1.2-2.8 0-1.2-.4-2.1-1.1-2.8-.8-.7-1.9-1-3.5-1h-4.8V20zm8.7 9.4c.9-.7 1.3-1.7 1.3-3s-.4-2.3-1.3-3c-.9-.7-2.1-1.1-3.7-1.1h-5v8.2h5c1.6-.1 2.8-.4 3.7-1.1zM95.3 24.6H81c.1 2.1.6 3.6 1.7 4.6s2.4 1.5 4 1.5c1.4 0 2.6-.4 3.6-1.1 1-.7 1.6-1.7 1.8-2.9h3.2c-.2 1.2-.7 2.4-1.5 3.3-.8 1-1.7 1.7-2.9 2.3-1.2.5-2.6.8-4.1.8-1.7 0-3.2-.4-4.6-1.1-1.3-.7-2.4-1.8-3.1-3.2-.8-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.8-1.4 1.8-2.5 3.1-3.2 1.3-.7 2.9-1.1 4.6-1.1 1.7 0 3.3.4 4.6 1.1 1.3.7 2.3 1.7 3 3 .7 1.2 1 2.6 1 4.1.1.7 0 1.2-.1 1.7zm-3.5-4.8c-.5-.9-1.2-1.6-2.1-2-.9-.4-1.8-.7-2.8-.7-1.6 0-3 .5-4.1 1.5-1.1 1-1.7 2.5-1.8 4.5h11.5c0-1.3-.2-2.4-.7-3.3zM111.2 16c1.2.9 2.1 2 2.5 3.5V15h3v18h-3v-4.6c-.5 1.5-1.3 2.6-2.5 3.5-1.2.9-2.7 1.3-4.4 1.3-1.6 0-3-.4-4.3-1.1-1.2-.7-2.2-1.8-2.9-3.2-.7-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.7-1.4 1.7-2.5 2.9-3.2 1.2-.7 2.7-1.1 4.3-1.1 1.7-.1 3.1.4 4.4 1.2zm-8 3.1c-1.1 1.2-1.7 2.8-1.7 4.8 0 2.1.5 3.7 1.7 4.8 1.1 1.2 2.6 1.8 4.4 1.8 1.2 0 2.2-.3 3.2-.8.9-.5 1.7-1.3 2.2-2.3.5-1 .8-2.1.8-3.5 0-1.3-.3-2.5-.8-3.5s-1.2-1.8-2.2-2.3c-.9-.5-2-.8-3.2-.8-1.9.1-3.3.7-4.4 1.8zM135 16.6c1.5 1.2 2.4 2.9 2.8 4.9h-3.1c-.2-1.3-.8-2.3-1.8-3-1-.7-2.2-1.1-3.6-1.1-1 0-2 .2-2.9.7-.9.5-1.6 1.2-2.1 2.2-.5 1-.8 2.2-.8 3.7s.3 2.7.8 3.7 1.2 1.7 2.1 2.2c.9.5 1.8.7 2.9.7 1.4 0 2.6-.4 3.6-1.1 1-.7 1.6-1.8 1.8-3h3.1c-.3 2.1-1.3 3.7-2.8 4.9-1.5 1.2-3.4 1.8-5.7 1.8-1.7 0-3.2-.4-4.6-1.1-1.3-.7-2.4-1.8-3.1-3.2-.8-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.8-1.4 1.8-2.5 3.1-3.2 1.3-.7 2.9-1.1 4.6-1.1 2.3-.1 4.2.6 5.7 1.8zM154.5 15.9c1.4.7 2.4 1.8 3.2 3.2.8 1.4 1.2 3 1.2 4.9 0 1.9-.4 3.5-1.2 4.9-.8 1.4-1.8 2.4-3.2 3.2-1.4.7-2.9 1.1-4.6 1.1-1.7 0-3.3-.4-4.6-1.1-1.4-.7-2.4-1.8-3.2-3.2-.8-1.4-1.2-3-1.2-4.9 0-1.9.4-3.5 1.2-4.9.8-1.4 1.9-2.5 3.2-3.2 1.4-.7 2.9-1.1 4.6-1.1 1.7-.1 3.2.3 4.6 1.1zm-7.6 2.2c-.9.5-1.6 1.2-2.2 2.2-.6 1-.8 2.2-.8 3.7 0 1.4.3 2.7.8 3.6.6 1 1.3 1.7 2.2 2.2.9.5 1.9.7 3 .7s2.1-.2 3-.7c.9-.5 1.6-1.2 2.2-2.2.6-1 .8-2.2.8-3.6 0-1.5-.3-2.7-.8-3.7-.6-1-1.3-1.7-2.2-2.2-.9-.5-1.9-.7-3-.7s-2.1.2-3 .7zM177.3 16.7c1.3 1.3 1.9 3.3 1.9 5.8v10.4h-3V22.8c0-1.8-.5-3.2-1.4-4.1-.9-1-2.2-1.4-3.7-1.4-1.6 0-2.9.5-3.9 1.6s-1.5 2.6-1.5 4.6V33h-3V15h3v4.3c.5-1.5 1.3-2.6 2.4-3.4 1.2-.8 2.5-1.2 4-1.2 2.2 0 3.9.6 5.2 2z'
                      ],
                      ['class', 'st1']
                    ])
                  ])
                ]
              ),
              createSanitizedElement(
                'div',
                ['beacon-modal__close__wrapper'],
                [['id', `beacon-alert-${id}-close`]],
                [
                  createSanitizedElement(
                    'div',
                    ['beacon-modal__close__icon'],
                    [],
                    [
                      createSanitizedElement('div', ['beacon-modal__close__line1'], [], []),
                      createSanitizedElement('div', ['beacon-modal__close__line2'], [], [])
                    ]
                  )
                ]
              )
            ]
          ),
          createSanitizedElement(
            'div',
            ['beacon-modal__base'],
            [],
            [
              createSanitizedElement(
                'div',
                [],
                [['id', 'beacon-modal__content']],
                [
                  createSanitizedElement(
                    'div',
                    [],
                    [],
                    [
                      createSanitizedElement('p', ['beacon-alert__title'], [], callToAction),
                      ...main,
                      createSanitizedElement('div', ['beacon-action__container'], [], buttons)
                    ]
                  )
                ]
              )
            ]
          )
        ]
      )
    ]
  )
}

export const constructDefaultAlert = (
  id: string,
  callToAction: HTMLElement[],
  buttons: HTMLElement[],
  main: HTMLElement[]
): HTMLElement => {
  return constructAlertContainer(id, callToAction, buttons, [
    createSanitizedElement('div', ['beacon-alert__text'], [['id', 'beacon-main-text']], main)
  ])
}

export const constructPairAlert = (
  id: string,
  callToAction: HTMLElement[],
  buttons: HTMLElement[],
  main: HTMLElement[]
): HTMLElement => {
  return constructAlertContainer(id, callToAction, buttons, [
    createSanitizedElement('span', [], [['id', 'pairing-container']], ''),
    createSanitizedElement(
      'div',
      ['beacon-alert__text'],
      [['id', 'beacon-main-text']],
      [
        createSanitizedElement(
          'p',
          ['beacon-list__title'],
          [['id', 'beacon-title']],
          [
            document.createTextNode('Scan QR code with a Beacon-compatible wallet.\u00A0'),
            createSanitizedElement(
              'a',
              [],
              [
                ['href', 'https://docs.walletbeacon.io/supported-wallets'],
                ['target', '_blank']
              ],
              'Learn more'
            ),
            ...main
          ]
        )
      ]
    ),
    createSanitizedElement(
      'div',
      [],
      [['id', 'beacon--switch__container']],
      [
        createSanitizedElement(
          'button',
          ['beacon-modal__button--outline'],
          [['id', 'beacon-switch']],
          ''
        )
      ]
    ),
    createSanitizedElement('div', [], [['id', 'beacon--disclaimer']], '')
  ])
}
