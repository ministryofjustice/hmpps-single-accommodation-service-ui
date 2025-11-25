import { Case } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { htmlContent } from './utils'

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const casesToRows = (cases: Case[]): TableRow[] =>
  cases.map(c => [htmlContent(`${c.name}, ${c.crn}`), htmlContent()])
