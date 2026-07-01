import accessibleAutocomplete from 'accessible-autocomplete'

function makeAutocomplete(selectElement) {
  if (selectElement.hasAttribute('data-autocomplete-hint')) {
    const elementId = selectElement.getAttribute('id')
    const hint = document.createElement('p')
    hint.className = 'govuk-hint'
    hint.textContent = 'Type to search.'

    const label = document.querySelector(`label[for="${elementId}"]`)
    if (label) label.insertAdjacentElement('afterend', hint)
  }

  const inputClasses = selectElement.getAttribute('data-autocomplete-input-classes') || ''
  const menuClasses = selectElement.getAttribute('data-autocomplete-menu-classes') || ''
  const wrapperClasses = selectElement.getAttribute('data-autocomplete-wrapper-classes') || ''

  accessibleAutocomplete.enhanceSelectElement({
    selectElement,
    defaultValue: '',
    inputClasses,
    menuClasses,
    showAllValues: true,
    confirmOnBlur: false,
  })

  if (wrapperClasses) {
    const wrapper = selectElement.parentElement && selectElement.parentElement.querySelector('.autocomplete__wrapper')
    if (wrapper) wrapper.classList.add(...wrapperClasses.split(' ').filter(Boolean))
  }
}

export default makeAutocomplete
