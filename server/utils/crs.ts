import { CrsServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { serviceStatusTag } from './statusTag'
import { formatDate, formatDateAndDaysAgo } from './dates'
import { summaryListRow } from './summaryListRow'

const crsStatusCardHint = (result: CrsServiceResult['serviceResult']): string => {
  const { serviceStatus, action } = result ?? {}
  switch (serviceStatus) {
    case 'NOT_ELIGIBLE':
      return 'No referral needed for accommodation.\nYou can still complete a CRS for other requirements.'
    case 'NOT_STARTED':
      return 'No open CRS accommodation referral.'
    case 'UPCOMING':
      return action?.startDate
        ? `Start referral from ${formatDate(action.startDate)} (${formatDate(action.startDate, 'days ago/in')}).`
        : undefined
    default:
      return undefined
  }
}

const crsStatusCardDetails = (crs?: CrsServiceResult): SummaryListRow[] => {
  if (!crs?.commissionedRehabilitativeServices?.submissionDate) return undefined

  return [summaryListRow('Submitted', formatDateAndDaysAgo(crs.commissionedRehabilitativeServices.submissionDate))]
}

const crsStatusCardLinks = (crs?: CrsServiceResult): Link[] => {
  const { serviceStatus, url } = crs?.serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start referral', ...link }]
    case 'SUBMITTED':
      return [{ text: 'View referral', ...link }]
    case 'NOT_ELIGIBLE':
    case 'NOT_REQUIRED':
    default:
      return undefined
  }
}

// eslint-disable-next-line import/prefer-default-export
export const crsStatusCard = (crs?: CrsServiceResult): StatusCard => {
  const { serviceResult } = crs || {}
  const { serviceStatus } = serviceResult

  return {
    heading: 'Commissioned Rehabilitative Services (CRS)',
    details: crsStatusCardDetails(crs),
    hint: crsStatusCardHint(serviceResult),
    inactive: serviceStatus === 'NOT_ELIGIBLE' || serviceStatus === 'NOT_REQUIRED',
    links: crsStatusCardLinks(crs),
    status: serviceStatusTag(serviceStatus),
  }
}
