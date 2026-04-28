import { EligibilityDto, ServiceResult } from '@sas/api'
import { StatusCard, StatusTag } from '@sas/ui'

const eligibilityStatusTag = (status?: ServiceResult['serviceStatus']): StatusTag =>
  ({
    NOT_ELIGIBLE: { text: 'Not eligible', colour: 'grey' },
    UPCOMING: { text: 'Upcoming', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'orange' },
    NOT_SUBMITTED: { text: 'Not submitted', colour: 'red' },
    INFO_REQUESTED: { text: 'Info requested', colour: 'yellow' },
    REJECTED: { text: 'Rejected', colour: 'red' },
    WITHDRAWN: { text: 'Withdrawn' },
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
    PLACEMENT_BOOKED: { text: 'Placement booked' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
    NOT_ARRIVED: { text: 'Not arrived' },
    PLACEMENT_CANCELLED: { text: 'Placement cancelled' },
    PLACEMENT_REQUEST_NOT_STARTED: { text: 'Placement request not started' },
    PLACEMENT_REQUEST_WITHDRAWN: { text: 'Placement request withdrawn' },
    PLACEMENT_REQUEST_SUBMITTED: { text: 'Placement request submitted' },
    PLACEMENT_REQUEST_REJECTED: { text: 'Placement request rejected' },
    APPLICATION_REJECTED: { text: 'Application rejected' },
    ARRIVED: { text: 'Arrived' },
    BEDSPACE_OFFERED: { text: 'Bedspace offered' },
    BOOKING_CONFIRMED: { text: 'Booking confirmed' },
    BOOKING_CANCELLED: { text: 'Booking cancelled' },
    ACCEPTED: { text: 'Accepted', colour: 'yellow' },
    NOT_ACCEPTED: { text: 'Not accepted', colour: 'grey' },
  })[status] || { text: 'Unknown' }

export const linksForStatus = (serviceStatus?: ServiceResult['serviceStatus']) => {
  switch (serviceStatus) {
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
      return [{ text: 'Notes', href: '#' }]
    case 'NOT_STARTED':
      return [
        { text: 'Start referral', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    default:
      return []
  }
}

export const eligibilityStatusCard = (title: string, service?: ServiceResult): StatusCard => ({
  heading: title,
  inactive: service?.serviceStatus === 'NOT_ELIGIBLE',
  status: eligibilityStatusTag(service?.serviceStatus),
  links: linksForStatus(service?.serviceStatus),
})

export const eligibilityToEligibilityCards = (eligibility: EligibilityDto): StatusCard[] => {
  const cardConfigs = [
    { title: 'Approved premises (CAS1)', eligibility: eligibility.cas1 },
    { title: 'CAS3 (transitional accommodation)', eligibility: eligibility.cas3 },
  ]

  // TODO remove filter once the API always returns eligibility for all services
  return cardConfigs
    .filter(config => config.eligibility)
    .map(config => eligibilityStatusCard(config.title, config.eligibility))
}
