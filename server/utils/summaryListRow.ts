import { SummaryListActionItem, SummaryListRow, TextOrHtmlContent } from '@govuk/ui'
import { textBlock } from './macros'
import { htmlContent, noValueHtml, textContent } from './utils'

type SummaryListRowOptions = {
  type?: 'text' | 'html' | 'textBlock'
  actions?: SummaryListActionItem[]
  noValue?: string
}

// eslint-disable-next-line import/prefer-default-export
export const summaryListRow = (label: string, text?: string, options: SummaryListRowOptions = {}): SummaryListRow => {
  const { type = 'text', actions, noValue } = options

  let value: TextOrHtmlContent

  if (text) {
    value = type === 'text' ? textContent(text) : htmlContent(type === 'textBlock' ? textBlock(text) : text)
  } else if (noValue) {
    value = htmlContent(noValueHtml(noValue))
  } else {
    value = textContent()
  }

  const row: SummaryListRow = {
    key: textContent(label),
    value,
  }

  if (actions) {
    row.actions = { items: actions }
  }

  return row
}
