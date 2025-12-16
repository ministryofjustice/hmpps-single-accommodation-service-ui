import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import { convertToTitleCase } from './utils'

export const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

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
