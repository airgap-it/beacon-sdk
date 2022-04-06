export const createUnsafeElementFromString = (el: string): HTMLElement => {
  const div = document.createElement('div')
  div.innerHTML = el.trim()
  return div.firstChild as HTMLElement
}

export const createSanitizedElement = (
  type: string,
  classes: string[],
  attributes: [string, string][],
  element: string | (HTMLElement | undefined)[]
): HTMLElement => {
  const el = document.createElement(type)

  el.classList.add(...classes.filter((clazz) => !!clazz))

  attributes.forEach((attribute) => {
    el.setAttribute(sanitizeText(attribute[0]), sanitizeText(attribute[1]))
  })

  if (typeof element === 'object' && Array.isArray(element)) {
    element
      .filter((childEl): childEl is HTMLElement => !!childEl)
      .forEach((childEl) => {
        el.appendChild(childEl)
      })
  } else {
    el.innerText = element
  }

  return el
}

export const sanitizeText = (text: string): string => {
  const div = document.createElement('div')
  div.innerText = text
  return div.innerHTML
}
