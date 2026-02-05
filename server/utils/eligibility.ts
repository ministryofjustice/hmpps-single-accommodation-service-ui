import { EligibilityDto, ServiceResult } from '@sas/api'
import { StatusCard, StatusTag } from '@sas/ui'

const eligibilityStatusTag = (status?: ServiceResult['serviceStatus']): StatusTag =>
  ({
    NOT_ELIGIBLE: { text: 'Not eligible' },
    UPCOMING: { text: 'Upcoming', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'red' },
    REJECTED: { text: 'Rejected', colour: 'red' },
    WITHDRAWN: { text: 'Withdrawn' },
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
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
    { title: 'CAS2 for HDC', eligibility: eligibility.cas2Hdc },
    { title: 'CAS2 for court bail', eligibility: eligibility.cas2CourtBail },
    { title: 'CAS2 for prison bail', eligibility: eligibility.cas2PrisonBail },
    { title: 'CAS3 (transitional accommodation)', eligibility: eligibility.cas3 },
  ]

  // TODO remove filter once the API always returns eligibility for all services
  return cardConfigs
    .filter(config => config.eligibility)
    .map(config => eligibilityStatusCard(config.title, config.eligibility))
}
