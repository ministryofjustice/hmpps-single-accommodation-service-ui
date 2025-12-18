import { CaseDto as Case, AccommodationReferralDto as Referral } from '@sas/api'
import { convertToTitleCase } from './utils'
import { calculateAge } from './person'

export const formatDate = (date?: string, format?: 'days' | 'age' | 'long') => {
  if (!date || Number.isNaN(new Date(date).getTime())) return 'Invalid Date'

  if (format === 'age') return `${calculateAge(date)}`

  if (format === 'days') {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 3600 * 24))
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  return new Date(date).toLocaleDateString('en-GB', {
    weekday: format === 'long' ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
