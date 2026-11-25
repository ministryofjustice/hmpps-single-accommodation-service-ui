import { CrsServiceResultWrapper, ServiceResultV2 } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { serviceStatusTag } from './statusTag'
import { formatDate, formatDateAndDaysAgo } from './dates'
import { summaryListRow } from './summaryListRow'

const crsStatusCardHint = (result?: ServiceResultV2): string => {
  const { serviceStatus, actionStartDate } = result ?? {}
  switch (serviceStatus) {
    case 'CRS_NOT_STARTED_REFERRAL':
    case 'CRS_NOT_STARTED_ACCOMMODATION_REFERRAL':
      return 'No open CRS accommodation referral.'
    case 'CRS_UPCOMING_REFERRAL':
    case 'CRS_UPCOMING_ACCOMMODATION_REFERRAL':
      return actionStartDate
        ? `Start referral from ${formatDate(actionStartDate)} (${formatDate(actionStartDate, 'days ago/in')}).`
        : undefined
    default:
      return undefined
  }
}

const crsStatusCardDetails = (crs?: CrsServiceResultWrapper): SummaryListRow[] => {
  if (!crs?.commissionedRehabilitativeServices?.submissionDate) return undefined

  return [summaryListRow('Submitted', formatDateAndDaysAgo(crs.commissionedRehabilitativeServices.submissionDate))]
}

const crsStatusCardLinks = (crs?: CrsServiceResultWrapper): Link[] => {
  const { serviceStatus, url } = crs?.serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'CRS_NOT_STARTED_REFERRAL':
    case 'CRS_NOT_STARTED_ACCOMMODATION_REFERRAL':
      return [{ text: 'Start referral', ...link }]
    case 'CRS_SUBMITTED':
      return [{ text: 'View referral', ...link }]
    default:
      return undefined
  }
}

// eslint-disable-next-line import/prefer-default-export
export const crsStatusCard = (crs?: CrsServiceResultWrapper): StatusCard => {
  const { serviceResult } = crs || {}
  const { serviceStatus } = serviceResult || {}

  return {
    heading: 'Commissioned Rehabilitative Services (CRS)',
    details: crsStatusCardDetails(crs),
    hint: crsStatusCardHint(serviceResult),
    inactive: serviceStatus === 'CRS_NOT_REQUIRED',
    links: crsStatusCardLinks(crs),
    status: serviceStatusTag(serviceStatus),
  }
}
