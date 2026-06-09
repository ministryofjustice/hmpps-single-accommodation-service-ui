import { EligibilityDto, ServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'
import { crsStatusCard } from './crs'

export const linksForStatus = (serviceStatus?: ServiceResult['serviceStatus']): Link[] => {
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
  hint:
    service?.serviceStatus === 'NOT_ELIGIBLE'
      ? 'This could be because of risk levels or suitability for a move on at this time.'
      : undefined,
  status: serviceStatusTag(service?.serviceStatus),
  links: linksForStatus(service?.serviceStatus),
})

export const eligibilityToEligibilityCards = (eligibility: EligibilityDto, crn: string): StatusCard[] => [
  dutyToReferStatusCard(crn, eligibility.dtr),
  crsStatusCard(eligibility.crs),
  eligibilityStatusCard('Approved premises (CAS1)', eligibility.cas1.serviceResult),
  eligibilityStatusCard('CAS3 (transitional accommodation)', eligibility.cas3.serviceResult),
]
