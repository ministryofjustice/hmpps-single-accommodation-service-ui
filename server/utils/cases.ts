import { AccommodationDetail, CaseDto as Case } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { GetCasesQuery, StatusTag } from '@sas/ui'
import { htmlContent } from './utils'
import { addressLines } from './addresses'
import { renderMacro } from './macros'

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

export const casesTabs = (
  url: string,
  peopleType: 'nfarisk' | 'housed',
): { text: string; href: string; selected?: boolean }[] => [
  {
    text: 'Housing support needed',
    href: updateQueryParams(url, { peopleType: 'nfarisk' }),
    selected: peopleType === 'nfarisk',
  },
  {
    text: 'Settled housing secured',
    href: updateQueryParams(url, { peopleType: 'housed' }),
    selected: peopleType === 'housed',
  },
]

export const casesResultsSummary = (cases: Case[]): string =>
  `${cases.length} ${cases.length === 1 ? 'person' : 'people'}`

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

export const removeQueryParam = (url: string, param: string): string => updateQueryParams(url, { [param]: undefined })

export const updateQueryParams = (url: string, updateParams: Record<string, unknown>): string => {
  const [path, search] = url.split('?')
  const params = new URLSearchParams(search)

  for (const [key, value] of Object.entries(updateParams)) {
    if (!value) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
  }

  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

export const personCell = (c: Case): string => renderMacro('personCell', c)

export const accommodationType = (accommodation: AccommodationDetail): string => {
  const { arrangementType, arrangementSubType, arrangementSubTypeDescription, name } = accommodation

  switch (arrangementType) {
    case 'PRISON':
      return name
    case 'PRIVATE':
      if (arrangementSubType === 'OTHER') return `Other: ${arrangementSubTypeDescription}`
      return arrangementSubTypes[arrangementSubType]
    case 'NO_FIXED_ABODE':
      return 'No accommodation'
    case 'CAS1':
      return 'Approved Premises (CAS1)'
    case 'CAS2':
      return 'CAS2 for HDC'
    case 'CAS2V2':
      return 'CAS2 Bail'
    case 'CAS3':
      return 'CAS3'
    default:
      return ''
  }
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
  arrangementType: AccommodationDetail['arrangementType']
  settledTag?: StatusTag
  name?: string
  address?: string
  startDate?: string
  endDate?: string
  link?: string
}

export const settledTag = (settledType?: AccommodationDetail['settledType']): StatusTag =>
  ({
    SETTLED: { text: 'Settled', colour: 'green' },
    TRANSIENT: { text: 'Transient', colour: 'purple' },
  })[settledType]

export const accommodationCard = (
  cardType: 'current' | 'next',
  accommodation?: AccommodationDetail,
): AccommodationCardContext => {
  if (!accommodation) return undefined

  const { arrangementType, settledType, startDate, endDate } = accommodation

  const context: AccommodationCardContext = {
    cardType,
    arrangementType,
    startDate,
    endDate,
  }

  if (arrangementType === 'NO_FIXED_ABODE') return context

  return {
    ...context,
    settledTag: settledTag(settledType),
    name: accommodationType(accommodation),
    address: addressLines(accommodation.address).join('<br />'),
  }
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

export const mapGetCasesQuery = (query: GetCasesQuery, userId: string): GetCasesQuery => {
  // eslint-disable-next-line prefer-const
  let { assignedTo, searchTerm, riskLevel, crns } = query

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
    assignedTo,
    crns,
    searchTerm,
    riskLevel,
  }
}
