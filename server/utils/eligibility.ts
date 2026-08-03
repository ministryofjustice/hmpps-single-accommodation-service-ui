import { EligibilityDto, ServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'
import { crsStatusCard } from './crs'
import { formatDate } from './dates'

export const linksForCas1Status = (serviceResult?: ServiceResult): Link[] => {
  const { serviceStatus, url } = serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start application', ...link }]
    case 'NOT_SUBMITTED':
      return [{ text: 'Continue application', ...link }]
    case 'APPLICATION_REJECTED':
      return [{ text: 'Start new application', ...link }]
    case 'SUBMITTED':
    case 'INFO_REQUESTED':
    case 'PLACEMENT_BOOKED':
    case 'PLACEMENT_REQUEST_SUBMITTED':
      return [{ text: 'View application', ...link }]
    case 'NOT_ARRIVED':
    case 'PLACEMENT_CANCELLED':
    case 'PLACEMENT_REQUEST_REJECTED':
    case 'PLACEMENT_REQUEST_WITHDRAWN':
      return [{ text: 'Create new placement request', ...link }]
    case 'PLACEMENT_REQUEST_NOT_STARTED':
      return [{ text: 'Create placement request', ...link }]
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
    default:
      return undefined
  }
}

export const linksForCas3Status = (serviceResult?: ServiceResult) => {
  const { serviceStatus, url } = serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start referral', ...link }]
    case 'SUBMITTED':
    case 'BEDSPACE_OFFERED':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      return [{ text: 'View referral', ...link }]
    case 'REJECTED':
      return [{ text: 'Start new referral', ...link }]
    case 'CANNOT_START_YET':
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

const hintForServiceResult = (service: 'cas1' | 'cas3', serviceResult?: ServiceResult): string => {
  const { serviceStatus, failureReasons, action } = serviceResult || {}

  if (serviceStatus === 'CANNOT_START_YET') {
    if (failureReasons.includes('DTR_REFERRAL_EXPIRED')) {
      // TODO: Handle MALE/NON_MALE CRS needed
      if (failureReasons.includes('CRS_NOT_SUBMITTED')) {
        return 'You need to add DTR referral details and submit a CRS accommodation referral before you can make a CAS3 referral.'
      }
      // if (failureReasons.includes('MALE_CRS_NOT_SUBMITTED')) {
      //   return 'You need to add DTR referral details and submit a CRS accommodation referral before you can make a CAS3 referral.'
      // }
      // if (failureReasons.includes('NON_MALE_CRS_NOT_SUBMITTED')) {
      //   return 'You need to add DTR referral details and submit a CRS referral before you can make a CAS3 referral.'
      // }
      return 'You need to add DTR referral details before you can make a CAS3 referral.'
    }

    // TODO: Handle MALE/NON_MALE CRS needed
    if (failureReasons.includes('CRS_NOT_SUBMITTED')) {
      return 'You need to submit a CRS accommodation referral before you can make a CAS3 referral.'
    }
    // if (failureReasons.includes('MALE_CRS_NOT_SUBMITTED')) {
    //   return 'You need to submit a CRS accommodation referral before you can make a CAS3 referral.'
    // }
    // if (failureReasons.includes('NON_MALE_CRS_NOT_SUBMITTED')) {
    //   return 'You need to submit a CRS accommodation referral before you can make a CAS3 referral.'
    // }
  }

  if (serviceStatus === 'NOT_ELIGIBLE' && service === 'cas1') {
    return 'This could be because of risk levels or suitability for a move on at this time.'
  }

  if (serviceStatus === 'UPCOMING' && action?.startDate) {
    return `Start referral from ${formatDate(action.startDate)} (${formatDate(action.startDate, 'days ago/in')}).`
  }

  if (serviceStatus === 'BEDSPACE_OFFERED') {
    return 'Bedspace details are sent by email'
  }

  return undefined
}

export const eligibilityStatusCard = (service: 'cas1' | 'cas3', serviceResult?: ServiceResult): StatusCard => {
  const { serviceStatus } = serviceResult ?? {}

  return {
    heading: headingForService(service),
    inactive: serviceStatus === 'NOT_ELIGIBLE',
    hint: hintForServiceResult(service, serviceResult),
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
