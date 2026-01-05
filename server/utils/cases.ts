import { CaseDto as Case, AccommodationDetail, AccommodationReferralDto as Referral } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { linksCell, dateCell, statusCell, textCell } from './tables'

const offenderReleaseTypes: Record<AccommodationDetail['offenderReleaseType'], string> = {
  REMAND: 'remand',
  LICENCE: 'licence',
  BAIL: 'bail',
}

const subTypes: Record<AccommodationDetail['subType'], string> = {
  OWNED: 'owned',
  LODGING: 'lodging',
  RENTED: 'rented',
}

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { ...c })
}

export const accommodationCell = (cellType: 'current' | 'next', accommodation?: AccommodationDetail): string => {
  const { type, subType, offenderReleaseType, name, isSettled } = accommodation

  let heading: string

  if (type === 'PRISON') {
    heading = `${name}${offenderReleaseType ? ` (${offenderReleaseTypes[offenderReleaseType]})` : ''}`
  } else if (type === 'PRIVATE') {
    heading = `Private address${subType ? ` (${subTypes[subType]})` : ''}<br>${name} (${isSettled ? 'settled' : 'transient'})`
  } else if (type === 'NO_FIXED_ABODE') {
    heading = 'No fixed abode'
  } else if (type === 'CAS1') {
    heading = 'Approved Premises (CAS1)'
  } else if (type === 'CAS2') {
    heading = 'CAS2 for HDC'
  } else if (type === 'CAS2V2') {
    heading = 'CAS2 for Bail'
  } else if (type === 'CAS3') {
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
