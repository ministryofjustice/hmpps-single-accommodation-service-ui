import { EligibilityDto, ServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'
import { crsStatusCard } from './crs'

export const linksForCas1Status = (serviceResult?: ServiceResult): Link[] => {
  const { serviceStatus, url } = serviceResult || {}

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start application', href: url }]
    case 'NOT_SUBMITTED':
      return [{ text: 'Continue application', href: url }]
    case 'APPLICATION_REJECTED':
      return [{ text: 'Start new application', href: url }]
    case 'SUBMITTED':
    case 'INFO_REQUESTED':
    case 'PLACEMENT_BOOKED':
    case 'PLACEMENT_REQUEST_SUBMITTED':
      return [{ text: 'View application', href: url }]
    case 'NOT_ARRIVED':
    case 'PLACEMENT_CANCELLED':
    case 'PLACEMENT_REQUEST_REJECTED':
    case 'PLACEMENT_REQUEST_WITHDRAWN':
      return [{ text: 'Create new placement request', href: url }]
    case 'PLACEMENT_REQUEST_NOT_STARTED':
      return [{ text: 'Create placement request', href: url }]
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
    default:
      return undefined
  }
}

export const linksForCas3Status = (serviceResult?: ServiceResult) => {
  const { serviceStatus, url } = serviceResult || {}

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start referral', href: url }]
    case 'SUBMITTED':
    case 'BEDSPACE_OFFERED':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      return [{ text: 'View referral', href: url }]
    case 'REJECTED':
      return [{ text: 'Start new referral', href: url }]
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
    default:
      return undefined
  }
}

export const linksForService = (service: 'cas1' | 'cas3', serviceResult?: ServiceResult): Link[] => {
  switch (service) {
    case 'cas1':
      return linksForCas1Status(serviceResult)
    case 'cas3':
      return linksForCas3Status(serviceResult)
    default:
      return undefined
  }
}

const headingForService = (service: 'cas1' | 'cas3') => {
  switch (service) {
    case 'cas1':
      return 'Approved premises (CAS1)'
    case 'cas3':
      return 'CAS3 (transitional accommodation)'
    default:
      return undefined
  }
}

export const eligibilityStatusCard = (service: 'cas1' | 'cas3', serviceResult?: ServiceResult): StatusCard => {
  const { serviceStatus } = serviceResult || {}

  return {
    heading: headingForService(service),
    inactive: serviceStatus === 'NOT_ELIGIBLE',
    hint:
      serviceStatus === 'NOT_ELIGIBLE'
        ? 'This could be because of risk levels or suitability for a move on at this time.'
        : undefined,
    status: serviceStatusTag(serviceStatus),
    links: linksForService(service, serviceResult),
  }
}

export const eligibilityToEligibilityCards = (eligibility: EligibilityDto, crn: string): StatusCard[] => [
  dutyToReferStatusCard(crn, eligibility.dtr),
  crsStatusCard(eligibility.crs),
  eligibilityStatusCard('cas1', eligibility.cas1.serviceResult),
  eligibilityStatusCard('cas3', eligibility.cas3.serviceResult),
]
