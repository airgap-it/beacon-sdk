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
    el.setAttribute(attribute[0], attribute[1] /* TODO: We need to sanitize this */)
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
