import { AccommodationReferralDto as Referral } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { AccommodationDto } from '@sas/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { linksCell, dateCell, statusCell, textCell } from './tables'
import { Case } from '../data/casesClient'

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { ...c })
}

export const accommodationCell = (cellType: 'current' | 'next', accommodation?: AccommodationDto): string => {
  const { type, qualifier, name, isSettled } = accommodation

  let heading: string

  if (type === 'prison') {
    heading = `${name}${qualifier ? ` (${qualifier})` : ''}`
  } else if (type === 'private') {
    heading = `Private address${qualifier ? ` (${qualifier})` : ''}<br>${name} (${isSettled ? 'settled' : 'transient'})`
  } else if (type === 'nfa') {
    heading = 'No fixed abode'
  } else if (type === 'cas1') {
    heading = 'Approved Premises (CAS1)'
  } else if (type === 'cas2') {
    heading = 'CAS2 for HDC'
  } else if (type === 'cas2v2') {
    heading = 'CAS2 for Bail'
  } else if (type === 'cas3') {
    heading = 'Temporary Accommodation (CAS3)'
  }

  return nunjucksInline().render('cases/partials/accommodationCell.njk', {
    cellType,
    heading,
    ...accommodation,
  })
}

export const casesToRows = (cases: Case[]): TableRow[] =>
  cases.map(c => [
    htmlContent(personCell(c)),
    htmlContent(accommodationCell('current', c.currentAccommodation)),
    htmlContent(accommodationCell('next', c.nextAccommodation)),
    htmlContent(),
  ])

export const caseAssignedTo = (c: Case, id: string): string => {
  return String(c.assignedTo?.id) === id ? `You (${c.assignedTo.name})` : c.assignedTo?.name
}

export const referralHistoryTable = (referrals: Referral[]): string => {
  return nunjucksInline().render('components/tables/referralHistoryTable.njk', {
    referralHistory: referralHistoryToRows(referrals),
  })
}

export const referralHistoryToRows = (referrals: Referral[]): TableRow[] => {
  return referrals.map(referral => [
    textCell(referral.type),
    statusCell(referral.status),
    dateCell(referral.date),
    linksCell([{ text: 'View', href: '#' }]),
  ])
}
