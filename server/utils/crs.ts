import { CrsServiceResult } from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { serviceStatusTag } from './statusTag'
import { summaryListRowText } from './utils'
import { formatDateAndDaysAgo } from './dates'

const crsStatusCardHint = (serviceStatus: CrsServiceResult['serviceResult']['serviceStatus']): string => {
  switch (serviceStatus) {
    case 'NOT_ELIGIBLE':
      return 'No housing need: has somewhere to stay'
    case 'NOT_STARTED':
      return 'No open CRS accommodation referral.'
    default:
      return undefined
  }
}

const crsStatusCardDetails = (crs?: CrsServiceResult): SummaryListRow[] => {
  if (!crs?.commissionedRehabilitativeServices?.submissionDate) return undefined

  return [summaryListRowText('Submitted', formatDateAndDaysAgo(crs.commissionedRehabilitativeServices.submissionDate))]
}

const crsStatusCardLinks = (serviceStatus: CrsServiceResult['serviceResult']['serviceStatus']): Link[] => {
  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start referral', href: '#' }]
    case 'SUBMITTED':
      return [{ text: 'View referral', href: '#' }]
    case 'NOT_ELIGIBLE':
    default:
      return undefined
  }
}

// eslint-disable-next-line import/prefer-default-export
export const crsStatusCard = (crs?: CrsServiceResult): StatusCard => {
  const {
    serviceResult: { serviceStatus },
  } = crs || {}

  return {
    heading: 'Commissioned Rehabilitative Services (CRS)',
    details: crsStatusCardDetails(crs),
    hint: crsStatusCardHint(serviceStatus),
    inactive: serviceStatus === 'NOT_ELIGIBLE',
    links: crsStatusCardLinks(serviceStatus),
    status: serviceStatusTag(serviceStatus),
  }
}
