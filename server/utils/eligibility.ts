import { EligibilityDto, ServiceResult } from '@sas/api'
import { StatusCard } from '@sas/ui'
import { eligibilityStatusColours, formatEligibilityStatus } from './format'

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
  status: {
    text: formatEligibilityStatus(service?.serviceStatus),
    colour: eligibilityStatusColours[service?.serviceStatus] || 'grey',
  },
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
