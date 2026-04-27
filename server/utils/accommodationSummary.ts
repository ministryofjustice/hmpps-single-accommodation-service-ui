import { AccommodationDetail, AccommodationStatusDto, AccommodationSummaryDto } from '@sas/api'
import { TableRow } from '@govuk/ui'
import { StatusTag } from '@sas/ui'
import { htmlContent, textContent } from './utils'
import { addressLines, formatAddress } from './addresses'
import { formatDate } from './dates'
import { renderMacro, statusTag } from './macros'

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
    address: formatAddress(accommodation.address, '<br />') || undefined,
    startDate,
    endDate,
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

const accommodationSummaryStatusTag = (status: AccommodationStatusDto): StatusTag => ({
  text: status.description,
  colour: status.code === 'M' ? 'green' : 'grey',
})

export const accommodationSummaryAddress = (accommodation: AccommodationSummaryDto): string => `
  <strong>${accommodation.type.description}</strong><br />
  ${formatAddress(accommodation.address, '<br />')}
`

export const accommodationHistoryRows = (history: AccommodationSummaryDto[]): TableRow[] => {
  return history.map(accommodation => [
    textContent(formatDate(accommodation.startDate)),
    textContent(accommodation.endDate ? formatDate(accommodation.endDate) : 'Current'),
    htmlContent(accommodationSummaryAddress(accommodation)),
    htmlContent(statusTag(accommodationSummaryStatusTag(accommodation.status))),
  ])
}

export const accommodationHistoryTable = (history: AccommodationSummaryDto[]): string =>
  renderMacro('accommodationHistoryTable', { rows: accommodationHistoryRows(history) })
