import { HtmlContent, SummaryListActionItem, SummaryListRow, TextContent } from '@govuk/ui'
import { SelectOption } from '@sas/ui'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const textContent = (text?: string): TextContent => ({ text: text || '' })

export const htmlContent = (html?: string): HtmlContent => ({ html: html || '' })

export const toParagraphs = (lines: string[], classes?: string): string =>
  lines
    .filter(Boolean)
    .map(line => `<p${classes ? ` class="${classes}"` : ''}>${line}</p>`)
    .join('')

export const convertObjectsToSelectOptions = (
  items: Array<Record<string, string>>,
  prompt: string,
  textKey: string,
  valueKey: string,
  selectedValue?: string,
): Array<SelectOption> => {
  const options = [
    {
      value: '',
      text: prompt,
      selected: !selectedValue,
    },
  ]

  items.forEach(item => {
    options.push({
      text: item[textKey],
      value: item[valueKey],
      selected: selectedValue === item[valueKey],
    })
  })

  return options
}

export const summaryListRowText = (label: string, value: string, actions?: SummaryListActionItem[]): SummaryListRow => {
  const row: SummaryListRow = {
    key: textContent(label),
    value: textContent(value),
  }

  if (actions) {
    row.actions = { items: actions }
  }

  return row
}

export const summaryListRowHtml = (
  label: string,
  value: string,
  actions?: SummaryListActionItem[],
): SummaryListRow => ({
  ...summaryListRowText(label, value, actions),
  value: htmlContent(value),
})

export const noValueHtml = (text: string, classes: string = 'sas-colour--dark-grey'): string =>
  `<span class="${classes}">${text}</span>`

export const summaryListRowOptional = (
  label: string,
  value: string | undefined,
  noValueText: string,
): SummaryListRow => (value ? summaryListRowText(label, value) : summaryListRowHtml(label, noValueHtml(noValueText)))
