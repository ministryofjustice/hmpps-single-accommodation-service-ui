import {
  Cas1ApplicationDto,
  Cas1PlacementPairDto,
  Cas1ServiceResult,
  Cas2ServiceResult,
  Cas3ServiceResult,
  EligibilityDto,
  ServiceResult,
} from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { SummaryListRow, TextOrHtmlContent } from '@govuk/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'
import { crsStatusCard } from './crs'
import { formatDate, formatDateAndDaysAgo } from './dates'
import config from '../config'
import { htmlContent } from './utils'
import { summaryListRow } from './summaryListRow'
import { govukDetails } from './macros'

const cas1WithdrawalReasonLabels: Record<string, string> = {
  DUPLICATE_PLACEMENT_REQUEST: 'The request was a duplicate',
  ALTERNATIVE_PROVISION_IDENTIFIED: 'Another provision has been identified',
  CHANGE_IN_CIRCUMSTANCES: 'Their circumstances changed',
  CHANGE_IN_RELEASE_DECISION: 'The release decision changed',
  NO_CAPACITY_DUE_TO_LOST_BED: "There's no capacity due to a lost bed",
  NO_CAPACITY_DUE_TO_PLACEMENT_PRIORITISATION: "There's no capacity due to placement prioritisation",
  NO_CAPACITY: "There's no capacity",
  ERROR_IN_PLACEMENT_REQUEST: 'There was an error in the request',
  WITHDRAWN_BY_PP: 'Withdrawn by the probation practitioner',
  RELATED_APPLICATION_WITHDRAWN: 'The related application was withdrawn',
  RELATED_PLACEMENT_REQUEST_WITHDRAWN: 'The related placement request was withdrawn',
  RELATED_PLACEMENT_APPLICATION_WITHDRAWN: 'The related placement application was withdrawn',
}

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
    case 'ARRIVED':
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

export const linksForCas2Status = (serviceResult?: ServiceResult) => {
  const { serviceStatus, url } = serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [{ text: 'Start application', ...link }]
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
    case 'NOT_SUBMITTED':
      return [{ text: 'Continue referral', ...link }]
    case 'REJECTED':
      return [{ text: 'Start new referral', ...link }]
    case 'CANNOT_START_YET':
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
    default:
      return undefined
  }
}

const upcomingStartHint = (serviceResult?: ServiceResult): string | undefined => {
  const { serviceStatus, action } = serviceResult ?? {}

  if (serviceStatus === 'UPCOMING' && action?.startDate) {
    return `Start referral from ${formatDate(action.startDate)} (${formatDate(action.startDate, 'days ago/in')}).`
  }

  return undefined
}

const hintForCas1Status = (serviceResult?: ServiceResult): string | undefined => {
  const { serviceStatus } = serviceResult ?? {}

  if (serviceStatus === 'NOT_ELIGIBLE') {
    return 'This could be because of risk levels or suitability for a move on at this time.'
  }

  return upcomingStartHint(serviceResult)
}

const hintForCas2Status = (serviceResult?: ServiceResult): string | undefined => {
  const { serviceStatus } = serviceResult ?? {}

  if (serviceStatus === 'NOT_STARTED') {
    return 'CAS2 accommodation is now available for more people.'
  }

  return upcomingStartHint(serviceResult)
}

const hintForCas3Status = (serviceResult?: ServiceResult): string | undefined => {
  const { serviceStatus, blockingStatusReason } = serviceResult ?? {}

  if (serviceStatus === 'CANNOT_START_YET') {
    const requirementTemplate = (requirement: string) =>
      `You need to ${requirement} before you can make a CAS3 referral.`

    switch (blockingStatusReason) {
      case 'SUBMIT_CRS_BEFORE_CAS3':
        return requirementTemplate('submit a CRS referral')
      case 'SUBMIT_DTR_BEFORE_CAS3':
        return requirementTemplate('add DTR referral details')
      case 'SUBMIT_DTR_AND_CRS_BEFORE_CAS3':
        return requirementTemplate('add DTR referral details and submit a CRS referral')
      case 'SUBMIT_CRS_ACCOMMODATION_BEFORE_CAS3':
        return requirementTemplate('submit a CRS accommodation referral')
      case 'SUBMIT_DTR_AND_CRS_ACCOMMODATION_BEFORE_CAS3':
        return requirementTemplate('add DTR referral details and submit a CRS accommodation referral')
      default:
        return ''
    }
  }

  if (serviceStatus === 'NOT_ELIGIBLE') {
    return 'Not at risk of homelessness.'
  }

  if (serviceStatus === 'BEDSPACE_OFFERED') {
    return 'Bedspace details are sent by email'
  }

  return upcomingStartHint(serviceResult)
}

const placementHistoryText = ({ requestForPlacement, placement }: Cas1PlacementPairDto): string | undefined => {
  switch (placement?.status) {
    case 'DEPARTED':
      if (placement.actualArrivalDate && placement.actualDepartureDate) {
        return `Departed (${formatDate(placement.actualArrivalDate)} to ${formatDate(placement.actualDepartureDate)})`
      }
      return 'Departed'

    case 'NOT_ARRIVED':
      return requestForPlacement?.expectedArrivalDate
        ? `Not arrived (due ${formatDate(requestForPlacement.expectedArrivalDate)})`
        : 'Not arrived'
  }

  switch (requestForPlacement?.status) {
    case 'REQUEST_WITHDRAWN':
      return `Request withdrawn${requestForPlacement.withdrawalDate ? ` (${formatDate(requestForPlacement.withdrawalDate)})` : ''}. Reason: ${cas1WithdrawalReasonLabels[requestForPlacement.withdrawalReason] || 'Unknown'}`

    case 'REQUEST_REJECTED':
      return `Request rejected. Reason: ${requestForPlacement.rejectionReason || 'Unknown'}`

    default:
      return undefined
  }
}

const contentForCas1Status = (
  serviceResult?: ServiceResult,
  cas1Application?: Cas1ApplicationDto,
): TextOrHtmlContent[] => {
  const { serviceStatus } = serviceResult ?? {}

  switch (serviceStatus) {
    case 'PLACEMENT_REQUEST_NOT_STARTED':
      const { placementHistory } = cas1Application ?? {}
      if (!placementHistory?.length) return undefined
      const history = placementHistory.map(placementHistoryText).filter((entry): entry is string => entry !== undefined)
      const placementCount = history.length

      if (!history.length) return undefined

      const content = `
        <ul class="govuk-list govuk-list--bullet">
          ${history.map(entry => `<li>${entry}</li>`).join('')}
        </ul>
      `
      return [htmlContent(govukDetails(`${placementCount} previous placements on this application`, content))]
    default:
      return undefined
  }
}

const contentForCas2Status = (serviceResult?: ServiceResult): TextOrHtmlContent[] => {
  const { serviceStatus } = serviceResult ?? {}

  switch (serviceStatus) {
    case 'NOT_STARTED':
      return [
        htmlContent(
          '<a class="govuk-body govuk-link govuk-link--no-visited-state" href="#" target="_blank" rel="noreferrer noopener">Find out more about CAS2 (opens in new tab)</a>',
        ),
      ]
    default:
      return undefined
  }
}

const placementDurationText = (durationDays?: number | null): string | undefined => {
  if (durationDays == null) return undefined

  const weeks = durationDays / 7
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
}

const detailsForCas1Status = (
  serviceResult?: ServiceResult,
  cas1Application?: Cas1ApplicationDto,
): SummaryListRow[] => {
  const { serviceStatus } = serviceResult ?? {}
  const { application, assessment, requestForPlacement, placement } = cas1Application ?? {}

  const submittedRow = () => summaryListRow('Submitted', formatDateAndDaysAgo(application?.submittedAt ?? undefined))
  const submittedByRow = () => summaryListRow('Submitted by', application?.createdBy?.name)
  const expiresRow = () => summaryListRow('Application expires', formatDate(application?.expiresAt ?? undefined))
  const requestSubmittedRow = () =>
    summaryListRow('Request submitted', formatDateAndDaysAgo(requestForPlacement?.submittedAt ?? undefined))
  const requestSubmittedByRow = () => summaryListRow('Request submitted by', requestForPlacement?.submittedBy?.name)

  switch (serviceStatus) {
    case 'NOT_SUBMITTED':
      return [
        summaryListRow('Application started', formatDateAndDaysAgo(application?.createdAt)),
        summaryListRow('Started by', application?.createdBy?.name),
      ]
    case 'SUBMITTED':
    case 'INFO_REQUESTED':
      return [submittedRow(), submittedByRow()]
    case 'APPLICATION_REJECTED':
      return [
        summaryListRow(
          'Decision',
          assessment?.rejectionRationale ? `Reject, ${assessment.rejectionRationale}` : 'Reject',
        ),
        submittedRow(),
        submittedByRow(),
      ]
    case 'PLACEMENT_BOOKED':
      return [
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        summaryListRow('Duration', placementDurationText(requestForPlacement?.durationDays)),
        requestSubmittedByRow(),
      ]
    case 'ARRIVED':
      return [
        summaryListRow('Arrival date', formatDateAndDaysAgo(placement?.actualArrivalDate ?? undefined)),
        summaryListRow('Expected departure', formatDateAndDaysAgo(placement?.actualDepartureDate ?? undefined)),
        requestSubmittedByRow(),
      ]
    case 'NOT_ARRIVED':
      return [
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'PLACEMENT_CANCELLED':
      return [
        summaryListRow('Cancellation reason', placement?.cancellationReason ?? undefined),
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'PLACEMENT_REQUEST_NOT_STARTED':
      return [submittedByRow(), expiresRow()]
    case 'PLACEMENT_REQUEST_SUBMITTED':
      return [requestSubmittedRow(), requestSubmittedByRow(), expiresRow()]
    case 'PLACEMENT_REQUEST_REJECTED':
      return [
        summaryListRow('Rejection reason', requestForPlacement?.rejectionReason ?? undefined),
        requestSubmittedRow(),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'PLACEMENT_REQUEST_WITHDRAWN':
      return [
        summaryListRow(
          'Withdrawal reason',
          requestForPlacement?.withdrawalReason
            ? (cas1WithdrawalReasonLabels[requestForPlacement.withdrawalReason] ?? requestForPlacement.withdrawalReason)
            : undefined,
        ),
        requestSubmittedRow(),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    default:
      return []
  }
}

const statusFields = (serviceResult?: ServiceResult): Pick<StatusCard, 'inactive' | 'blocked' | 'status'> => {
  const { serviceStatus } = serviceResult ?? {}

  return {
    inactive: serviceStatus === 'NOT_ELIGIBLE',
    blocked: serviceStatus === 'CANNOT_START_YET',
    status: serviceStatusTag(serviceStatus),
  }
}

export const cas1StatusCard = ({ serviceResult, cas1Application }: Cas1ServiceResult): StatusCard => ({
  heading: 'Approved premises (CAS1)',
  ...statusFields(serviceResult),
  hint: hintForCas1Status(serviceResult),
  links: linksForCas1Status(serviceResult),
  details: detailsForCas1Status(serviceResult, cas1Application),
  content: contentForCas1Status(serviceResult, cas1Application),
})

export const cas2StatusCard = ({ serviceResult }: Cas2ServiceResult): StatusCard => ({
  heading: 'Short-term accommodation (CAS2)',
  ...statusFields(serviceResult),
  hint: hintForCas2Status(serviceResult),
  links: linksForCas2Status(serviceResult),
  content: contentForCas2Status(serviceResult),
})

export const cas3StatusCard = ({ serviceResult }: Cas3ServiceResult): StatusCard => ({
  heading: 'CAS3 (transitional accommodation)',
  ...statusFields(serviceResult),
  hint: hintForCas3Status(serviceResult),
  links: linksForCas3Status(serviceResult),
})

export const eligibilityToEligibilityCards = (eligibility: EligibilityDto, crn: string): StatusCard[] =>
  [
    dutyToReferStatusCard(crn, eligibility.dtr),
    crsStatusCard(eligibility.crs),
    cas1StatusCard(eligibility.cas1),
    config.flags.cas2Enabled ? cas2StatusCard(eligibility.cas2) : undefined,
    cas3StatusCard(eligibility.cas3),
  ].filter(Boolean)
