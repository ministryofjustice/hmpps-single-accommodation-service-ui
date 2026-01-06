import { CaseDto as Case, AccommodationReferralDto as Referral, ServiceResult } from '@sas/api'
import { convertToTitleCase } from './utils'
import { calculateAge } from './person'

export const formatDate = (date?: string, format?: 'days' | 'age') => {
  if (!date || Number.isNaN(new Date(date).getTime())) return 'Invalid Date'

  if (format === 'age') return `${calculateAge(date)}`

  if (format === 'days') return `${Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 3600 * 24))}`

  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const formatRiskLevel = (level?: Case['riskLevel']) => {
  return (
    {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    }[level as NonNullable<typeof level>] || 'Unknown'
  )
}

export const formatEligibilityStatus = (status?: string): string => {
  return convertToTitleCase(status?.split('_').join(' ') || 'Unknown')
}

export const formatStatus = (status?: Referral['status']): string => {
  return convertToTitleCase(status || 'Unknown')
}

export const referralStatusTag = (status?: Referral['status']): string => {
  switch (status) {
    case 'PENDING':
      return `<strong class="govuk-tag govuk-tag--yellow">${formatStatus(status)}</strong>`
    case 'REJECTED':
      return `<strong class="govuk-tag govuk-tag--grey">${formatStatus(status)}</strong>`
    case 'ACCEPTED':
      return `<strong class="govuk-tag govuk-tag--green">${formatStatus(status)}</strong>`
    default:
      return `<strong class="govuk-tag govuk-tag--grey">${formatStatus(status)}</strong>`
  }
}

export const eligibilityStatusTag = (status?: ServiceResult['serviceStatus']): string => {
  switch (status) {
    case 'NOT_STARTED':
      return `<strong class="govuk-tag govuk-tag--red">${formatEligibilityStatus(status)}</strong>`
    case 'UPCOMING':
      return `<strong class="govuk-tag govuk-tag--yellow">${formatEligibilityStatus(status)}</strong>`
    case 'ARRIVED':
    case 'AWAITING_PLACEMENT':
    case 'AWAITING_ASSESSMENT':
    case 'ASSESSMENT_IN_PROGRESS':
    case 'PENDING_PLACEMENT_REQUEST':
      return `<strong class="govuk-tag govuk-tag--green">${formatEligibilityStatus(status)}</strong>`
    case 'NOT_ELIGIBLE':
    default:
      return `<strong class="govuk-tag govuk-tag--grey">${formatEligibilityStatus(status)}</strong>`
  }
}
