import { CaseDto as Case, AccommodationDetail, AccommodationReferralDto as Referral } from '@sas/api'
import { SummaryListRow, TableRow } from '@govuk/ui'
import { htmlContent } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { linksCell, dateCell, statusCell, textCell } from './tables'
import { formatDate } from './format'

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

export const accommodationType = (accommodation: AccommodationDetail): string => {
  const { type, subType, offenderReleaseType } = accommodation

  switch (type) {
    case 'PRISON':
      return `Prison${offenderReleaseType ? ` (${offenderReleaseTypes[offenderReleaseType]})` : ''}`
    case 'PRIVATE':
      return `Private address${subType ? ` (${subTypes[subType]})` : ''}`
    case 'NO_FIXED_ABODE':
      return 'No fixed abode'
    case 'CAS1':
      return 'Approved Premises (CAS1)'
    case 'CAS2':
      return 'CAS2 for HDC'
    case 'CAS2V2':
      return 'CAS2 for Bail'
    case 'CAS3':
      return 'Temporary Accommodation (CAS3)'
    default:
      return ''
  }
}

export const addressTitle = (accommodation: AccommodationDetail): string => {
  const { type, name, isSettled } = accommodation
  switch (type) {
    case 'PRISON':
      return `${name}`
    case 'PRIVATE':
      if (isSettled !== undefined) return `${name} (${isSettled ? 'settled' : 'transient'})`
      return `${name}`
    default:
      return ''
  }
}

export const accommodationCell = (cellType: 'current' | 'next', accommodation?: AccommodationDetail): string =>
  accommodation
    ? nunjucksInline().render('cases/partials/accommodationCell.njk', {
        cellType,
        accommodationType: accommodationType(accommodation),
        addressTitle: addressTitle(accommodation),
        ...accommodation,
      })
    : ''

const summaryListRow = (label: string, value: string, renderAs: 'text' | 'html' = 'text'): SummaryListRow => ({
  key: { text: label },
  value: renderAs === 'html' ? { html: value } : { text: value },
})

export const accommodationCard = (cardType: 'current' | 'next', accommodation?: AccommodationDetail) => {
  if (!accommodation) return ''

  const { type } = accommodation
  const heading = cardType === 'current' ? 'Current accommodation' : 'Next accommodation'
  const rows = []

  if (type !== 'NO_FIXED_ABODE') {
    if (cardType === 'current') {
      rows.push(summaryListRow('Type', accommodationType(accommodation), 'html'))

      if (accommodation.endDate) {
        const endDateHtml = `
          ${formatDate(accommodation.endDate)}
          <br />
          ${formatDate(accommodation.endDate, 'days for/left')}
        `
        rows.push(summaryListRow(type === 'PRISON' ? 'Release date' : 'End date', endDateHtml, 'html'))
      }
    }

    if (cardType === 'next') {
      const { startDate, endDate } = accommodation

      let datesHtml = ''

      if (startDate) {
        datesHtml += `From ${formatDate(startDate, 'long')}`
      }
      if (endDate) {
        datesHtml += `${startDate ? `<br />to ` : 'Until'} ${formatDate(endDate, 'long')}`
      }

      const statusHtml = `
        <p>
          <strong>${accommodationType(accommodation)}</strong>
          ${datesHtml ? `<br /><span class="govuk-hint">${datesHtml}</span>` : ''}
        </p>
      `

      rows.push(summaryListRow('Status', statusHtml, 'html'))
    }

    const addressLines = [
      addressTitle(accommodation) ? `<strong>${addressTitle(accommodation)}</strong>` : '',
      ...Object.values(accommodation.address || {}),
    ].filter(Boolean)

    if (addressLines.length > 0) rows.push(summaryListRow('Address', addressLines.join('<br />'), 'html'))
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
