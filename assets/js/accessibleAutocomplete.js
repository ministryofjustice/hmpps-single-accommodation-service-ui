import accessibleAutocomplete from 'accessible-autocomplete'

function makeAutocomplete(selectElement) {
  if (selectElement.hasAttribute('data-autocomplete-hint')) {
    const elementId = selectElement.getAttribute('id')
    const hint = document.createElement('p')
    hint.className = 'govuk-hint'
    hint.textContent = 'Start typing and select an option'
    document.querySelector(`label[for="${elementId}"]`).insertAdjacentElement('afterend', hint)
  }

  const inputClasses = selectElement.getAttribute('data-autocomplete-input-classes') || ''

  accessibleAutocomplete.enhanceSelectElement({
    selectElement,
    defaultValue: '',
    inputClasses,
  })
}

export default makeAutocomplete
