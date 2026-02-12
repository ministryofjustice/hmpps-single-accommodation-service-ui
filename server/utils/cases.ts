import { Request, Response } from 'express'
import { CaseDto as Case, AccommodationDetail, AccommodationReferralDto as Referral } from '@sas/api'
import { SummaryListRow, TableRow } from '@govuk/ui'
import { GetCasesQuery } from '@sas/ui'
import { htmlContent, initialiseName } from './utils'
import { nunjucksInline } from './nunjucksSetup'
import { linksCell, dateCell, statusCell, textCell } from './tables'
import { addressLines, formatDate, formatRiskLevel } from './format'
import CasesService from '../services/casesService'

const offenderReleaseTypes: Record<AccommodationDetail['offenderReleaseType'], string> = {
  REMAND: 'remand',
  LICENCE: 'licence',
  BAIL: 'bail',
}

export const arrangementSubTypes: Record<AccommodationDetail['arrangementSubType'], string> = {
  FRIENDS_OR_FAMILY: 'Friends or family (not tenant or owner)',
  SOCIAL_RENTED: 'Social rent (tenant)',
  PRIVATE_RENTED_WHOLE_PROPERTY: 'Private rent, whole property (tenant)',
  PRIVATE_RENTED_ROOM: 'Private rent, room/share (tenant)',
  OWNED: 'Owned (named on deeds/mortgage)',
  OTHER: 'Other',
}

export const casesTableCaption = (cases: Case[], query: GetCasesQuery = {}, userFullName?: string): string => {
  const filters: string[] = []
  if (query.riskLevel) filters.push(`${formatRiskLevel(query.riskLevel).toLowerCase()} RoSH`)

  let caption = `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

  if (query.searchTerm) {
    caption += ` matching '${query.searchTerm}'`
    if (query.assignedTo || filters.length > 0) caption += `,`
  }

  if (query.assignedTo) caption += ` assigned to ${query.assignedTo}`
  const initialisedName = initialiseName(userFullName)
  if (query.assignedTo === 'you' && initialisedName) caption += ` (${initialisedName})`

  if (filters.length > 0) caption += ` filtered by ${filters.join(', ')}`

  return caption
}

export const personCell = (c: Case): string => {
  return nunjucksInline().render('cases/partials/personCell.njk', { ...c })
}

export const accommodationType = (accommodation: AccommodationDetail): string => {
  const { arrangementType, offenderReleaseType } = accommodation

  switch (arrangementType) {
    case 'PRISON':
      return `Prison${offenderReleaseType ? ` (${offenderReleaseTypes[offenderReleaseType]})` : ''}`
    case 'PRIVATE':
      return `Private address${offenderReleaseType ? ` (${offenderReleaseTypes[offenderReleaseType]})` : ''}`
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
  const { arrangementType, name, arrangementSubType } = accommodation
  switch (arrangementType) {
    case 'PRISON':
      return `${name}`
    case 'PRIVATE':
      return arrangementSubTypes[arrangementSubType]
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

export const summaryListRow = (label: string, value: string, renderAs: 'text' | 'html' = 'text'): SummaryListRow => ({
  key: { text: label },
  value: renderAs === 'html' ? { html: value } : { text: value },
})

export const accommodationCard = (cardType: 'current' | 'next', accommodation?: AccommodationDetail) => {
  if (!accommodation) return ''

  const { arrangementType } = accommodation
  const heading = cardType === 'current' ? 'Current accommodation' : 'Next accommodation'
  const rows = []

  if (arrangementType !== 'NO_FIXED_ABODE') {
    if (cardType === 'current') {
      rows.push(summaryListRow('Type', accommodationType(accommodation), 'html'))

      if (accommodation.endDate) {
        const endDateHtml = `
          ${formatDate(accommodation.endDate)}
          <br />
          ${formatDate(accommodation.endDate, 'days for/left')}
        `
        rows.push(summaryListRow(arrangementType === 'PRISON' ? 'Release date' : 'End date', endDateHtml, 'html'))
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

    const address = [
      addressTitle(accommodation) ? `<strong>${addressTitle(accommodation)}</strong>` : '',
      ...addressLines(accommodation.address),
    ].filter(Boolean)

    if (address.length > 0) rows.push(summaryListRow('Address', address.join('<br />'), 'html'))
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

export const getCaseData = async (req: Request, res: Response, casesService: CasesService) => {
  const token = res.locals?.user?.token
  const { crn } = req.params
  return casesService.getCase(token, crn)
}

export const mapGetCasesQuery = (query: GetCasesQuery, userId: string): GetCasesQuery => {
  let { assignedTo, searchTerm, crns } = query

  if (query.assignedTo === 'you') assignedTo = userId
  if (query.assignedTo === 'anyone') assignedTo = ''

  // FIXME -- Experimental Easter Egg: allows loading a list of CRNs directly from the address bar for demo purposes,
  //  by visiting e.g. `/?crns=X371199,X960658`.
  if (crns) {
    crns = String(crns).split(',')
  }
  // FIXME -- Experimental Easter Egg: allows searching for one of the 'test' CRNs the API
  //  is able to provide mock data for.
  const findCrns = searchTerm?.match(/[A-Za-z]\d{6}/g)
  if (findCrns?.length > 0) {
    searchTerm = ''
    crns = findCrns
  }

  return {
    ...query,
    assignedTo,
    crns,
    searchTerm,
  }
}
