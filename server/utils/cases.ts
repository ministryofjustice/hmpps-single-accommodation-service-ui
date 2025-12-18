import { AccommodationReferralDto as Referral } from '@sas/api'
import { SummaryListRow, TableRow } from '@govuk/ui'
import { AccommodationDto } from '@sas/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { linksCell, dateCell, statusCell, textCell } from './tables'
import { Case } from '../data/casesClient'
import { formatDate } from './format'

export const casesTableCaption = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'} assigned to you`

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { ...c })
}

const accommodationType = (accommodation: AccommodationDto): string => {
  const { type, subtype, qualifier, name, isSettled } = accommodation

  switch (type) {
    case 'prison':
      return `${name}${qualifier ? ` (${qualifier})` : ''}`
    case 'private':
      return `Private address${subtype ? ` (${subtype})` : ''}<br>${name} (${isSettled ? 'settled' : 'transient'})`
    case 'nfa':
      return 'No fixed abode'
    case 'cas1':
      return 'Approved Premises (CAS1)'
    case 'cas2':
      return 'CAS2 for HDC'
    case 'cas2v2':
      return 'CAS2 for Bail'
    case 'cas3':
      return 'Temporary Accommodation (CAS3)'
    default:
      return 'Unknown'
  }
}

export const accommodationCell = (cellType: 'current' | 'next', accommodation?: AccommodationDto): string =>
  nunjucksInline().render('cases/partials/accommodationCell.njk', {
    cellType,
    heading: accommodationType(accommodation),
    ...accommodation,
  })

const summaryListRow = (label: string, value: string, renderAs: 'text' | 'html' = 'text'): SummaryListRow => ({
  key: { text: label },
  value: renderAs === 'html' ? { html: value } : { text: value },
})

export const accommodationCard = (cardType: 'current' | 'next', accommodation: AccommodationDto) => {
  const { type } = accommodation
  const heading = cardType === 'current' ? 'Current accommodation' : 'Next accommodation'
  const rows = []

  if (type !== 'nfa') {
    if (cardType === 'current') {
      rows.push(summaryListRow('Type', accommodationType(accommodation), 'html'))

      const endDateHtml = `
        ${formatDate(accommodation.endDate)}
        <br>
        ${formatDate(accommodation.endDate, 'days')} left
      `
      rows.push(summaryListRow('End date', endDateHtml, 'html'))
    }

    if (cardType === 'next') {
      const { startDate, endDate, status } = accommodation

      let datesHtml: string

      if (startDate && endDate) {
        datesHtml = `
          From ${formatDate(startDate, 'long')}
          <br>
          to ${formatDate(endDate, 'long')}
        `
      } else if (startDate) {
        datesHtml = `From ${formatDate(startDate, 'long')}`
      } else if (endDate) {
        datesHtml = `Until ${formatDate(endDate, 'long')}`
      }

      const statusHtml = `
        <p>
          <strong>${accommodationType(accommodation)}</strong>
          ${datesHtml ? `<br><span class="govuk-hint">${datesHtml}</span>` : ''}
        </p>
        ${status ? `<span class="govuk-tag govuk-tag--green">Confirmed</span>` : ''}
      `
      rows.push(summaryListRow('Status', statusHtml, 'html'))
    }

    rows.push(summaryListRow('Address', Object.values(accommodation.address).filter(Boolean).join('<br>'), 'html'))
  }

  return nunjucksInline().render('components/accommodationCard.njk', {
    cardType,
    heading,
    rows,
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

export const referralHistoryToRows = (referrals: Referral[]): TableRow[] => {
  return referrals.map(referral => [
    textCell(referral.type),
    statusCell(referral.status),
    dateCell(referral.date),
    linksCell([{ text: 'View', href: '#' }]),
  ])
}
