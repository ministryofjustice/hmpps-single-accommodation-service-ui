import { AccommodationDetail, AccommodationSummaryDto, CaseDto as Case } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesQuery, StatusCell, StatusTag } from '@sas/ui'
import { htmlContent } from './utils'
import { addressLines } from './addresses'
import { renderMacro, statusCell } from './macros'
import config from '../config'

export const arrangementSubTypes: Record<AccommodationDetail['arrangementSubType'], string> = {
  FRIENDS_OR_FAMILY: 'Friends or family (not tenant or owner)',
  SOCIAL_RENTED: 'Social rent (tenant)',
  PRIVATE_RENTED_WHOLE_PROPERTY: 'Private rent, whole property (tenant)',
  PRIVATE_RENTED_ROOM: 'Private rent, room/share (tenant)',
  OWNED: 'Owned (named on deeds/mortgage)',
  OTHER: 'Other',
}

export const formatRiskLevel = (level?: Case['riskLevel']) => {
  return (
    {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    }[level] || 'Unknown'
  )
}

export const casesResultsSummary = (cases: Case[]): string => {
  const summary = `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

  return summary
}

export const queryToFilters = (query: GetCasesQuery, currentUrl: string): { text: string; href: string }[] => {
  const filters: { text: string; href: string }[] = []
  if (query?.searchTerm)
    filters.push({ text: `Search: '${query.searchTerm}'`, href: removeQueryParam(currentUrl, 'searchTerm') })
  if (query?.assignedTo && query.assignedTo !== 'you')
    filters.push({ text: `Assigned to: ${query.assignedTo}`, href: removeQueryParam(currentUrl, 'assignedTo') })
  if (query?.riskLevel)
    filters.push({ text: `RoSH: ${formatRiskLevel(query.riskLevel)}`, href: removeQueryParam(currentUrl, 'riskLevel') })
  return filters
}

const removeQueryParam = (url: string, param: string): string => {
  const [path, search] = url.split('?')
  const params = new URLSearchParams(search)
  params.delete(param)
  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

export const personCell = (c: Case): string => renderMacro('personCell', c)

export const actionsCell = (actions: Case['actions']): string => renderMacro('actionsCell', { actions })

export const accommodationType = (accommodation: AccommodationSummaryDto): string => {
  const { type } = accommodation
  return (
    {
      A10: 'CAS2 accommodation of 13 weeks or more',
      A11: 'CAS2 accommodation of less than 13 weeks',
      A07B: 'Living in the home of a friend, family member or partner: settled',
      A07A: 'Living in the home of a friend, family member or partner: transient',
      A14: 'HOIE Section 10: staying in a Home Office specified residence',
      A13: 'HOIE Section 4: staying in Home Office accommodation support',
      A01A: 'Owner of the property',
      A15: 'Immigration detention',
      A12: 'Living in a care home or nursing home',
      A01C: 'Renting from a private landlord or letting agent',
      A01D: 'Renting from a council or housing association (social housing)',
      A02: 'Approved Premises',
      A04: 'Supported housing (with support services)',
      A03: 'Transient or short-term accommodation',
      A08: 'Homeless - Squat',
      A08A: 'Homeless - Rough Sleeping',
      A08C: 'Homeless - Shelter/Emergency Hostel/Campsite',
      A16: 'Awaiting Assessment',
      A17: 'CAS3',
    }[type?.code] || 'Unknown'
  )
}

export const accommodationCell = (cellType: 'current' | 'next', accommodation?: AccommodationDetail): string =>
  accommodation
    ? renderMacro('accommodationCell', {
        cellType,
        accommodationType: accommodationType(accommodation),
        addressLine1: accommodation.address ? addressLines(accommodation.address)[0] : undefined,
        ...accommodation,
      })
    : ''

type AccommodationCardContext = {
  cardType: 'current' | 'next'
  settledTag?: StatusTag
  name?: string
  address?: string
  startDate?: string
  endDate?: string
  link?: string
}

const settled: StatusTag = { text: 'Settled', colour: 'green' }
const transient: StatusTag = { text: 'Transient', colour: 'purple' }

export const settledTag = (type?: AccommodationSummaryDto['type']): StatusTag =>
  ({
    A07B: settled,
    A01A: settled,
    A12: settled,
    A01C: settled,
    A01D: settled,
    A04: settled,
    A02: transient,
    A10: transient,
    A11: transient,
    A17: transient,
    A07A: transient,
    A14: transient,
    A13: transient,
    A15: transient,
    A03: transient,
    A08A: undefined,
    A08C: undefined,
    A08: undefined,
    A16: undefined,
  })[type?.code]

export const accommodationCard = (
  cardType: 'current' | 'next',
  accommodation?: AccommodationSummaryDto,
): AccommodationCardContext => {
  if (!accommodation) return undefined

  const { startDate, endDate, type } = accommodation

  return {
    cardType,
    settledTag: settledTag(type),
    name: accommodationType(accommodation),
    address: accommodation.address ? addressLines(accommodation.address).join('<br />') : undefined,
    startDate,
    endDate,
  }
}

export const casesToRows = (cases: Case[]): TableRow[] =>
  cases.map(c => {
    if (!config.flags.v10CasesList) {
      return [htmlContent(personCell(c))]
    }

    return [
      htmlContent(personCell(c)),
      htmlContent(accommodationCell('current', c.currentAccommodation)),
      htmlContent(accommodationCell('next', c.nextAccommodation)),
      htmlContent(statusCell(caseStatusCell(c))),
      htmlContent(actionsCell(c.actions)),
    ]
  })

export const casesTableColumns = () => {
  if (!config.flags.v10CasesList) {
    return [{ text: 'Person' }]
  }

  return [
    { text: 'Person' },
    { text: 'Current accommodation' },
    { text: 'Next accommodation' },
    { text: 'Status' },
    { text: 'Actions' },
  ]
}

export const caseAssignedTo = (c: Case, username: string): string => {
  return String(c.assignedTo?.username) === username ? `You (${c.assignedTo.name})` : c.assignedTo?.name
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

export const caseStatusCell = (c: Case): StatusCell => {
  const date = c.currentAccommodation?.endDate
  return (
    {
      RISK_OF_NO_FIXED_ABODE: { status: { text: 'Risk of no fixed abode', colour: 'orange' }, date },
      NO_FIXED_ABODE: { status: { text: 'No fixed abode', colour: 'grey' } },
      TRANSIENT: { status: { text: 'Transient', colour: 'purple' } },
      SETTLED: { status: { text: 'Settled', colour: 'green' } },
    }[c.status] || { status: { text: 'Unknown' } }
  )
}
