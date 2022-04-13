export const createSanitizedElement = (
  type: string,
  classes: string[],
  attributes: [string, string][],
  element: string | (HTMLElement | Text | SVGSVGElement | undefined)[] | undefined
): HTMLElement => {
  const el = document.createElement(type)

  if (classes.length > 0) {
    // Filter empty classnames and add all classes to element
    el.classList.add(...classes.filter((clazz) => !!clazz).map((clazz) => sanitizeText(clazz)))
  }

  // Add all attributes to element
  attributes.forEach((attribute) => {
    el.setAttribute(sanitizeText(attribute[0]), sanitizeText(attribute[1]))
  })

  if (typeof element === 'object' && Array.isArray(element)) {
    // If we get a list of elements, add all of them as children
    element
      .filter((childEl): childEl is HTMLElement => !!childEl)
      .forEach((childEl) => {
        el.appendChild(childEl)
      })
  } else if (typeof element === 'string') {
    // Use `innerText` to assign text to prevent malicious code from being rendered
    el.innerText = element
  } else {
    // NOOP
  }

  return el
}

export const createSVGElement = (
  classes: string[],
  attributes: [string, string][],
  element: (SVGPathElement | SVGGElement | HTMLElement)[]
): SVGSVGElement => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  if (classes.length > 0) {
    el.classList.add(...classes.filter((clazz) => !!clazz))
  }

  attributes.forEach((attribute) => {
    el.setAttribute(sanitizeText(attribute[0]), sanitizeText(attribute[1]))
  })

  if (typeof element === 'object' && Array.isArray(element)) {
    element
      .filter((childEl): childEl is SVGPathElement => !!childEl)
      .forEach((childEl) => {
        el.appendChild(childEl)
      })
  } else {
    // NOOP
  }

  return el
}

export const createSVGPathElement = (attributes: [string, string][]): SVGPathElement => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  attributes.forEach((attribute) => {
    el.setAttribute(sanitizeText(attribute[0]), sanitizeText(attribute[1]))
  })

  return el
}

export const createSVGGElement = (element: SVGPathElement[]): SVGGElement => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  element
    .filter((childEl): childEl is SVGPathElement => !!childEl)
    .forEach((childEl) => {
      el.appendChild(childEl)
    })

  return el
}

export const createIconSVGExternal = () => {
  return createSVGElement(
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
}

export const sanitizeText = (text: string): string => {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}

export const removeAllChildren = (el: HTMLElement): void => {
  el.innerHTML = ''
}
