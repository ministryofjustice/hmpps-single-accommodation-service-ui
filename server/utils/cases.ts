import { Case } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { calculateAge } from './person'

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { person: c, age: calculateAge(c.dateOfBirth) })
}

export const casesToRows = (cases: Case[]): TableRow[] => cases.map(c => [htmlContent(personCell(c)), htmlContent()])
