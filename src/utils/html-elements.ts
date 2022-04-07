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

export const sanitizeText = (text: string): string => {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}

export const removeAllChildren = (el: HTMLElement): void => {
  el.innerHTML = ''
}
