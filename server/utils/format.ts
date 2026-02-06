import {
  CaseDto as Case,
  DutyToReferDto,
  AccommodationReferralDto as Referral,
  ServiceResult,
  AccommodationAddressDetails,
  AccommodationDetail,
} from '@sas/api'
import { calculateAge } from './person'

const isValidDate = (date?: string) => date && !Number.isNaN(new Date(date).getTime())

export const formatDate = (
  date?: string,
  format?: 'age' | 'long' | 'days' | 'days for/in' | 'days ago/in' | 'days for/left',
): string => {
  if (!isValidDate(date)) return 'Invalid Date'

  if (format === 'age') return `${calculateAge(date)}`

  if (format?.startsWith('days')) {
    const days = Math.ceil((new Date(date.substring(0, 10)).getTime() - Date.now()) / (1000 * 3600 * 24))
    const daysLabel = Math.abs(days) === 1 ? 'day' : 'days'

    if (days === 0 && format !== 'days') return 'today'
    if (days < 0) {
      if (format.includes('for')) return `for ${Math.abs(days)} ${daysLabel}`
      if (format.includes('ago')) return `${Math.abs(days)} ${daysLabel} ago`
    }
    if (days > 0) {
      if (format.includes('left')) return `${days} ${daysLabel} left`
      if (format.includes('in')) return `in ${days} ${daysLabel}`
    }

    return days.toString()
  }

  return new Date(date)
    .toLocaleDateString('en-GB', {
      weekday: format === 'long' ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '')
}

export const formatDateAndDaysAgo = (date?: string): string => {
  if (!isValidDate(date)) return 'Invalid Date'

  return `${formatDate(date)} (${formatDate(date, 'days ago/in')})`
}

export const formatRiskLevel = (level?: Case['riskLevel']) => {
  return (
    {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    }[level] || 'Unknown'
  )
}

export const formatDutyToReferStatus = (status?: DutyToReferDto['status']): string => {
  return (
    {
      NOT_STARTED: 'Not started',
      UPCOMING: 'Upcoming',
      SUBMITTED: 'Submitted',
      NOT_ELIGIBLE: 'Not eligible',
    }[status] || 'Unknown'
  )
}

export const formatEligibilityStatus = (status?: ServiceResult['serviceStatus']): string => {
  return (
    {
      NOT_ELIGIBLE: 'Not eligible',
      UPCOMING: 'Upcoming',
      NOT_STARTED: 'Not started',
      REJECTED: 'Rejected',
      WITHDRAWN: 'Withdrawn',
      SUBMITTED: 'Submitted',
      CONFIRMED: 'Confirmed',
    }[status] || 'Unknown'
  )
}

export const formatStatus = (status?: Referral['status']): string => {
  return (
    {
      PENDING: 'Pending',
      REJECTED: 'Rejected',
      ACCEPTED: 'Accepted',
    }[status] || 'Unknown'
  )
}

const renderStatusTag = (text: string, colour: string) =>
  `<strong class="govuk-tag govuk-tag--${colour}">${text}</strong>`

const referralStatusColours: Record<string, string> = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'grey',
}

export const referralStatusTag = (status?: Referral['status']): string => {
  return renderStatusTag(formatStatus(status), referralStatusColours[status] || 'grey')
}

export const eligibilityStatusColours: Record<string, string> = {
  NOT_ELIGIBLE: 'grey',
  UPCOMING: 'yellow',
  NOT_STARTED: 'red',
  REJECTED: 'red',
  WITHDRAWN: 'grey',
  SUBMITTED: 'yellow',
  CONFIRMED: 'green',
}

export const eligibilityStatusTag = (status?: ServiceResult['serviceStatus']): string => {
  return renderStatusTag(formatEligibilityStatus(status), eligibilityStatusColours[status] || 'grey')
}

export const dutyToReferStatusColours: Record<string, string> = {
  NOT_STARTED: 'red',
  UPCOMING: 'yellow',
  SUBMITTED: 'green',
  NOT_ELIGIBLE: 'grey',
}

export const dutyToReferStatusTag = (status?: string): string => {
  return renderStatusTag(formatDutyToReferStatus(status), dutyToReferStatusColours[status] || 'grey')
}

export const addressLines = (address: AccommodationAddressDetails = {}): string[] => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  return [
    `${subBuildingName || ''} ${buildingName || ''}`,
    `${buildingNumber || ''} ${thoroughfareName || ''}`,
    `${postTown || ''}`,
    `${postcode || ''}`,
  ]
    .map(part => part.trim())
    .filter(Boolean)
}

export const formatProposedAddressStatus = (status?: AccommodationDetail['status']): string => {
  return (
    {
      NOT_CHECKED_YET: 'Not checked',
      FAILED: 'Checks failed',
      PASSED: 'Checks passed',
    }[status] || 'Unknown'
  )
}

export const proposedAddressStatusColours: Record<AccommodationDetail['status'], string> = {
  NOT_CHECKED_YET: 'red',
  FAILED: 'grey',
  PASSED: 'yellow',
}

export const formatAddress = (address: AccommodationAddressDetails): string => {
  const { subBuildingName, buildingName, buildingNumber, thoroughfareName, postTown, postcode } = address
  return [subBuildingName, buildingName, `${buildingNumber || ''} ${thoroughfareName || ''}`, postTown, postcode]
    .filter(Boolean)
    .map(part => part.trim())
    .join(', ')
}
