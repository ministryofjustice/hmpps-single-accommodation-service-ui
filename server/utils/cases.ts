import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { calculateAge } from './person'
import { linksCell, dateCell, statusCell, textCell } from './tables'

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { person: c, age: calculateAge(c.dateOfBirth) })
}

export const casesToRows = (cases: Case[]): TableRow[] => cases.map(c => [htmlContent(personCell(c)), htmlContent()])

export const caseAssignedTo = (c: Case, id: string): string => {
  return String(c.assignedTo?.id) === id ? `You (${c.assignedTo.name})` : c.assignedTo?.name
}

export const referralHistoryToRows = (referrals: Referral[]): TableRow[] => {
  return referrals.map(referral => [
    textCell(referral.type),
    statusCell(referral.status),
    dateCell(referral.date),
    linksCell([
      { text: 'View', href: '#' },
      { text: 'Notes', href: '#' },
    ]),
  ])
}
