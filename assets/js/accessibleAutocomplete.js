import accessibleAutocomplete from 'accessible-autocomplete'
import dropdownArrow from './dropdownArrow'

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

  const configurationOptions = {
    selectElement,
    defaultValue: '',
    inputClasses,
    menuClasses,
    showAllValues: true,
    dropdownArrow,
    confirmOnBlur: true,
    preserveNullOptions: true,
    autoselect: true,
  }
  const availableOptions = [].filter.call(
    configurationOptions.selectElement.options,
    option => option.value || configurationOptions.preserveNullOptions,
  )
  configurationOptions.source = (query, populateResults) => {
    configurationOptions.selectElement.selectedIndex = -1
    const filteredResults = availableOptions
      .map(option => option.textContent || option.innerText)
      .filter(result => result.toLowerCase().indexOf(query.toLowerCase()) !== -1)
    populateResults(filteredResults)
  }
  accessibleAutocomplete.enhanceSelectElement(configurationOptions)

  if (wrapperClasses) {
    const wrapper = selectElement.parentElement && selectElement.parentElement.querySelector('.autocomplete__wrapper')
    if (wrapper) wrapper.classList.add(...wrapperClasses.split(' ').filter(Boolean))
  }
}

export default makeAutocomplete
