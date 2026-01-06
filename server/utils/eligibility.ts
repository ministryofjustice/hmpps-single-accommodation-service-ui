import { EligibilityDto, ServiceResult } from '@sas/api'
import { nunjucksInline } from './nunjucksSetup'
import { eligibilityStatusTag } from './format'

export const serviceStatusToCardStatus = (status: string) => {
  switch (status) {
    case 'NOT_ELIGIBLE':
      return 'NOT_ELIGIBLE' // NOT ELIGIBLE
    case 'NOT_STARTED':
    case 'UPCOMING':
      return 'NOT_STARTED' // NO APPLICATION
    case 'AWAITING_ASSESSMENT':
    case 'UNALLOCATED_ASSESSMENT':
    case 'ASSESSMENT_IN_PROGRESS':
    case 'AWAITING_PLACEMENT':
    case 'REQUEST_FOR_FURTHER_INFORMATION':
    case 'PENDING_PLACEMENT_REQUEST':
    case 'DEPARTED':
    case 'NOT_ARRIVED':
    case 'CANCELLED':
      return 'UPCOMING' // SUITABLE APPLICATION, PLACEMENT NEEDED
    case 'ARRIVED':
    case 'UPCOMING_PLACEMENT':
      return 'CONFIRMED' // SUITABLE APPLICATION AND NO ACTION NEEDED
    default:
      return ''
  }
}

export const linksForStatus = (serviceStatus?: string) => {
  switch (serviceStatus) {
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
      return [{ text: 'Notes', href: '#' }]
    case 'NOT_STARTED':
      return [
        { text: 'Start referral', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    case 'ARRIVED':
      return [{ text: 'Referral and notes', href: '#' }]
    default:
      return []
  }
}

const eligibilityCard = (title: string, service?: ServiceResult): string => {
  return nunjucksInline().render('components/eligibilityCard.njk', {
    title,
    serviceStatus: service?.serviceStatus,
    serviceStatusTag: eligibilityStatusTag(service?.serviceStatus),
    actions: service?.actions,
    links: linksForStatus(service?.serviceStatus),
  })
}

export const eligibilityToEligibilityCards = (eligibility: EligibilityDto): string[] => {
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
    .map(config => eligibilityCard(config.title, config.eligibility))
}
