import {
  Cas1ApplicationDto,
  Cas1PlacementPairDto,
  Cas1ServiceResultWrapper,
  Cas2ApplicationDto,
  Cas2ServiceResultWrapper,
  Cas3ApplicationDto,
  Cas3ExternalPreviousBookingDto,
  Cas3ServiceResultWrapper,
  EligibilityV2Dto,
  ServiceResultV2,
} from '@sas/api'
import { Link, StatusCard } from '@sas/ui'
import { SummaryListRow, TextOrHtmlContent } from '@govuk/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'
import { crsStatusCard } from './crs'
import { daysBetween, formatDate, formatDateAndDaysAgo } from './dates'
import config from '../config'
import { htmlContent, textContent } from './utils'
import { summaryListRow } from './summaryListRow'
import { bulletList, govukDetailsList } from './macros'
import { cas3PremisesToAccommodationAddress, formatAddress } from './addresses'
import uiPaths from '../paths/ui'

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

const isHiddenForFailureReason = (
  serviceResult: ServiceResultV2 | undefined,
  reasons: ServiceResultV2['failureReasons'],
): boolean =>
  serviceResult !== undefined &&
  serviceResult.serviceStatus.includes('NOT_ELIGIBLE') &&
  (serviceResult.failureReasons?.some(reason => reasons.includes(reason)) ?? false)

export const linksForCas1Status = (serviceResult?: ServiceResultV2): Link[] => {
  const { serviceStatus, url } = serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'CAS1_NOT_STARTED':
      return [{ text: 'Start application', ...link }]
    case 'CAS1_NOT_SUBMITTED':
      return [{ text: 'Continue application', ...link }]
    case 'CAS1_APPLICATION_REJECTED':
      return [{ text: 'Start new application', ...link }]
    case 'CAS1_ARRIVED':
    case 'CAS1_SUBMITTED':
    case 'CAS1_INFO_REQUESTED':
    case 'CAS1_PLACEMENT_BOOKED':
    case 'CAS1_PLACEMENT_REQUEST_SUBMITTED':
      return [{ text: 'View application', ...link }]
    case 'CAS1_NOT_ARRIVED':
    case 'CAS1_PLACEMENT_CANCELLED':
    case 'CAS1_PLACEMENT_REQUEST_REJECTED':
    case 'CAS1_PLACEMENT_REQUEST_WITHDRAWN':
      return [{ text: 'Create new placement request', ...link }]
    case 'CAS1_PLACEMENT_REQUEST_NOT_STARTED':
    case 'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED':
      return [{ text: 'Create placement request', ...link }]
    case 'CAS1_NOT_ELIGIBLE':
    case 'CAS1_UPCOMING':
    default:
      return undefined
  }
}

export const linksForCas2Status = (
  serviceResult?: ServiceResultV2,
  cas2Application?: Cas2ApplicationDto | null,
  crn?: string,
) => {
  const { serviceStatus, url } = serviceResult || {}
  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'CAS2_NOT_STARTED':
      return [{ text: 'Start application', ...link }]
    case 'CAS2_NOT_SUBMITTED':
    case 'CAS2_MORE_INFORMATION_NEEDED':
      return [{ text: 'Continue application', ...link }]
    case 'CAS2_SUBMITTED':
    case 'CAS2_AWAITING_DECISION':
    case 'CAS2_ON_WAITING_LIST':
    case 'CAS2_PLACE_OFFERED':
    case 'CAS2_OFFER_ACCEPTED':
    case 'CAS2_ARRIVED':
      return [{ text: 'View application', ...link }]
    case 'CAS2_AWAITING_ARRIVAL':
      if (config.flags.cas2ManualArrivalEnabled && cas2Application && crn) {
        const markAsArrivedLink: Omit<Link, 'text'> = {
          href: uiPaths.applications.arrival({ crn, applicationId: cas2Application.id }),
          external: false,
        }
        return [
          { text: 'View application', ...link },
          { text: 'Mark as arrived', ...markAsArrivedLink },
        ]
      }
      return [{ text: 'View application', ...link }]
    case 'CAS2_OFFER_DECLINED_OR_WITHDRAWN':
    case 'CAS2_CANCELLED':
    case 'CAS2_WITHDRAWN':
      return [{ text: 'Start new application', ...link }]
    default:
      return undefined
  }
}

export const linksForCas3Status = (serviceResult?: ServiceResultV2) => {
  const { serviceStatus, url } = serviceResult || {}

  const link: Omit<Link, 'text'> = { href: url, external: true }

  switch (serviceStatus) {
    case 'CAS3_NOT_STARTED':
      return [{ text: 'Start referral', ...link }]
    case 'CAS3_ARRIVED':
    case 'CAS3_SUBMITTED':
    case 'CAS3_BEDSPACE_OFFERED':
    case 'CAS3_BOOKING_CONFIRMED':
    case 'CAS3_BOOKING_CANCELLED':
      return [{ text: 'View referral', ...link }]
    case 'CAS3_NOT_SUBMITTED':
      return [{ text: 'Continue referral', ...link }]
    case 'CAS3_NOT_STARTED_NEW':
    case 'CAS3_REJECTED':
      return [{ text: 'Start new referral', ...link }]
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION':
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS':
    case 'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION':
    case 'CAS3_CANNOT_START_YET_SUBMIT_CRS':
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR':
    case 'CAS3_NOT_ELIGIBLE':
    case 'CAS3_UPCOMING':
    default:
      return undefined
  }
}

const upcomingStartHint = (serviceResult?: ServiceResultV2): string | undefined => {
  const { serviceStatus, actionStartDate } = serviceResult ?? {}

  if (['CAS1_UPCOMING', 'CAS2_UPCOMING', 'CAS3_UPCOMING'].includes(serviceStatus) && actionStartDate) {
    return `Start referral from ${formatDate(actionStartDate)} (${formatDate(actionStartDate, 'days ago/in')}).`
  }

  return undefined
}

const hintForCas1Status = (serviceResult?: ServiceResultV2): string | undefined => {
  const { serviceStatus, failureReasons } = serviceResult ?? {}

  if (serviceStatus === 'CAS1_NOT_ELIGIBLE') {
    if (failureReasons.includes('MALE_NOT_HIGH_RISK_TIER') || failureReasons.includes('NON_MALE_NOT_HIGH_RISK_TIER'))
      return 'Tier not eligible for this level of supervision.'
  }

  return upcomingStartHint(serviceResult)
}

const hintForCas2Status = (serviceResult?: ServiceResultV2): string | undefined => {
  return upcomingStartHint(serviceResult)
}

const hintForCas3Status = (serviceResult?: ServiceResultV2): string | undefined => {
  const { serviceStatus, failureReasons } = serviceResult ?? {}

  if (serviceStatus === 'CAS3_NOT_ELIGIBLE') {
    if (failureReasons.includes('INVALID_CURRENT_ACCOMMODATION_TYPE')) {
      return 'Only for prison leavers, move on from Approved premises or CAS2.'
    }

    return 'Not at risk of homelessness.'
  }

  if (serviceStatus === 'CAS3_BEDSPACE_OFFERED') {
    return 'Bedspace details are sent by email'
  }

  return upcomingStartHint(serviceResult)
}

const bookingHistoryText = (booking?: Cas3ExternalPreviousBookingDto): string | undefined => {
  if (!booking) return undefined

  switch (booking.bookingStatus) {
    case 'CANCELLED': {
      const { cancellation } = booking
      const formattedDate = cancellation?.cancellationDate ? formatDate(cancellation.cancellationDate) : ''

      if (cancellation?.cancellationReason) {
        return formattedDate
          ? `Booking cancelled (${formattedDate}). Reason: ${cancellation.cancellationReason}`
          : `Booking cancelled. Reason: ${cancellation.cancellationReason}`
      }

      return 'Booking cancelled'
    }
    default:
      return undefined
  }
}

const placementHistoryText = ({ requestForPlacement, placement }: Cas1PlacementPairDto): string | undefined => {
  switch (placement?.status) {
    case 'ARRIVED':
      return placement.actualArrivalDate ? `Arrived (${formatDate(placement.actualArrivalDate)})` : 'Arrived'

    case 'UPCOMING': {
      const expectedArrivalDate = requestForPlacement?.expectedArrivalDate ?? placement.premises?.startDate
      return expectedArrivalDate
        ? `Placement upcoming (Expected arrival: ${formatDate(expectedArrivalDate)})`
        : 'Placement upcoming'
    }

    case 'DEPARTED':
      if (placement.actualArrivalDate && placement.actualDepartureDate) {
        return `Departed (${formatDate(placement.actualArrivalDate)} to ${formatDate(placement.actualDepartureDate)})`
      }
      return 'Departed'

    case 'CANCELLED':
      if (placement.cancellationReason) {
        return `Cancelled. Reason: ${placement.cancellationReason ?? 'Unknown'}`
      }
      return 'Cancelled'

    case 'NOT_ARRIVED':
      return requestForPlacement?.expectedArrivalDate
        ? `Not arrived (due ${formatDate(requestForPlacement.expectedArrivalDate)})`
        : 'Not arrived'

    default:
      break
  }

  switch (requestForPlacement?.status) {
    case 'REQUEST_SUBMITTED':
      return `Placement request submitted${requestForPlacement.submittedAt ? ` (${formatDate(requestForPlacement.submittedAt)})` : ''}`

    case 'AWAITING_MATCH':
      return `Placement request awaiting match${requestForPlacement.submittedAt ? ` (${formatDate(requestForPlacement.submittedAt)})` : ''}`

    case 'REQUEST_WITHDRAWN':
      return `Request withdrawn${requestForPlacement.withdrawalDate ? ` (${formatDate(requestForPlacement.withdrawalDate)})` : ''}. Reason: ${cas1WithdrawalReasonLabels[requestForPlacement.withdrawalReason] ?? 'Unknown'}`

    case 'REQUEST_REJECTED':
      return `Request rejected${requestForPlacement.submittedAt ? ` (${formatDate(requestForPlacement.submittedAt)})` : ''}. Reason: ${requestForPlacement.rejectionReason ?? 'Unknown'}`

    default:
      return undefined
  }
}

const contentForCas1Status = (
  serviceResult?: ServiceResultV2,
  cas1Application?: Cas1ApplicationDto,
): TextOrHtmlContent[] => {
  const { serviceStatus } = serviceResult ?? {}

  switch (serviceStatus) {
    case 'CAS1_PLACEMENT_REQUEST_WITHDRAWN':
    case 'CAS1_PLACEMENT_BOOKED':
    case 'CAS1_PLACEMENT_REQUEST_SUBMITTED':
    case 'CAS1_PLACEMENT_REQUEST_REJECTED':
    case 'CAS1_PLACEMENT_REQUEST_NOT_STARTED':
    case 'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED':
    case 'CAS1_PLACEMENT_CANCELLED':
    case 'CAS1_NOT_ARRIVED':
    case 'CAS1_ARRIVED': {
      const { placementHistory } = cas1Application ?? {}
      if (!placementHistory?.length) return undefined
      const history = placementHistory.map(placementHistoryText).filter((entry): entry is string => entry !== undefined)

      if (!history.length) return undefined

      return [
        htmlContent(
          govukDetailsList(
            `${history.length} previous placement${history.length === 1 ? '' : 's'} on this application`,
            history,
          ),
        ),
      ]
    }
    default:
      return undefined
  }
}

const cas2NotEligibleSummaries: Partial<Record<ServiceResultV2['failureReasons'][number], string>> = {
  INVALID_TIER: 'Tier not eligible',
  UNDER_18: 'Age (applicant is under 18)',
  SEXUAL_OFFENCE_REGISTRATIONS_PRESENT: 'Sexual offence history',
}

const cas2NotEligibleReasons: Partial<Record<ServiceResultV2['failureReasons'][number], string>> = {
  INVALID_TIER: 'Tier not eligible.',
  SEXUAL_OFFENCE_REGISTRATIONS_PRESENT: 'Not eligible due to sexual offence history.',
  UNDER_18: 'Not eligible as applicant is under 18.',
  IN_CAS3_ACCOMMODATION: 'Not eligible as applicant is currently in a CAS3 property.',
  IN_PRISON_NO_RELEASE_DATE: 'Must have a conditional release date to start application.',
  IN_CAS2_ACCOMMODATION: 'Not eligible as applicant is currently in a CAS2 property.',
  IN_COMMUNITY: 'Not eligible unless at risk of recall.',
}

const contentForCas2Status = (serviceResult?: ServiceResultV2): TextOrHtmlContent[] => {
  const { serviceStatus, failureReasons } = serviceResult ?? {}

  if (serviceStatus?.includes('NOT_ELIGIBLE')) {
    if (failureReasons.length >= 2) {
      const bullets = failureReasons.map(reason => cas2NotEligibleSummaries[reason]).filter(Boolean)
      return [htmlContent(bulletList('Not eligible due to:', bullets))]
    }

    return failureReasons
      .map(reason => cas2NotEligibleReasons[reason])
      .filter(Boolean)
      .map(text => textContent(text))
      .slice(0, 1)
  }

  return []
}

const contentForCas3Status = (
  serviceResult?: ServiceResultV2,
  cas3Application?: Cas3ApplicationDto,
): TextOrHtmlContent[] => {
  const { serviceStatus } = serviceResult ?? {}
  const requirementTemplate = (requirement: string) => `You need to ${requirement} before you can make a CAS3 referral.`

  switch (serviceStatus) {
    case 'CAS3_CANNOT_START_YET_SUBMIT_CRS':
      return [textContent(requirementTemplate('submit a CRS referral'))]
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR':
      return [textContent(requirementTemplate('add DTR referral details'))]
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS':
      return [
        htmlContent(
          bulletList('Before you can make a CAS3 referral, you need to:', [
            'Add DTR referral details',
            'Submit a CRS referral',
          ]),
        ),
      ]
    case 'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION':
      return [textContent(requirementTemplate('submit a CRS accommodation referral'))]
    case 'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION':
      return [
        htmlContent(
          bulletList('Before you can make a CAS3 referral, you need to:', [
            'Add DTR referral details',
            'Submit a CRS accommodation referral',
          ]),
        ),
      ]
    case 'CAS3_BEDSPACE_OFFERED':
    case 'CAS3_SUBMITTED': {
      const { previousBookings } = cas3Application ?? {}
      if (!previousBookings?.length) return undefined
      const history = previousBookings.map(bookingHistoryText).filter((entry): entry is string => entry !== undefined)

      if (!history.length) return undefined

      return [
        htmlContent(
          govukDetailsList(
            `${history.length} previous booking${history.length === 1 ? '' : 's'} on this application`,
            history,
          ),
        ),
      ]
    }
    default:
      return undefined
  }
}

const detailsForCas2Status = (
  serviceResult: ServiceResultV2,
  cas2Application?: Cas2ApplicationDto | null,
): SummaryListRow[] => {
  if (!cas2Application) return []
  const { createdAt, createdBy, submittedApplication } = cas2Application

  const submittedRow = () =>
    summaryListRow(
      'Submitted',
      submittedApplication?.submittedAt ? formatDateAndDaysAgo(submittedApplication.submittedAt) : undefined,
    )
  const submittedByRow = () => summaryListRow('Submitted by', createdBy.name)
  const arrivedRow = () =>
    summaryListRow(
      'Marked as arrived by',
      submittedApplication.markedAsArrived
        ? `${submittedApplication.markedAsArrived.arrivedByName} (${formatDate(submittedApplication.markedAsArrived.dateTime, 'days ago/in')})`
        : undefined,
    )

  switch (serviceResult.serviceStatus) {
    case 'CAS2_NOT_SUBMITTED':
      return [
        summaryListRow('Application started', formatDateAndDaysAgo(createdAt)),
        summaryListRow('Started by', createdBy.name),
      ]
    case 'CAS2_MORE_INFORMATION_NEEDED':
    case 'CAS2_SUBMITTED':
    case 'CAS2_AWAITING_DECISION':
    case 'CAS2_ON_WAITING_LIST':
    case 'CAS2_PLACE_OFFERED':
    case 'CAS2_OFFER_ACCEPTED':
    case 'CAS2_AWAITING_ARRIVAL':
    case 'CAS2_WITHDRAWN':
      return [submittedRow(), submittedByRow()]
    case 'CAS2_ARRIVED':
      return [submittedRow(), submittedByRow(), arrivedRow()]
    case 'CAS2_OFFER_DECLINED_OR_WITHDRAWN':
      return [
        summaryListRow('Reason', submittedApplication?.offerDeclinedReason ?? undefined),
        submittedRow(),
        submittedByRow(),
      ]
    case 'CAS2_CANCELLED':
      return [
        summaryListRow('Reason', submittedApplication?.cancelledReason ?? undefined),
        submittedRow(),
        submittedByRow(),
      ]
    default:
      return []
  }
}

const placementDurationText = (durationDays?: number | null): string | undefined => {
  if (durationDays == null) return undefined

  const weeks = Math.floor(durationDays / 7)
  const days = durationDays % 7

  const weekText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  const dayText = `${days} ${days === 1 ? 'day' : 'days'}`

  if (!weeks) return dayText
  if (!days) return weekText
  return `${weekText}, ${dayText}`
}

const detailsForCas1Status = (
  serviceResult: ServiceResultV2,
  cas1Application?: Cas1ApplicationDto,
): SummaryListRow[] => {
  const { serviceStatus } = serviceResult ?? {}
  if (!cas1Application) return []
  const { application, assessment, requestForPlacement, placement } = cas1Application

  const submittedRow = () => summaryListRow('Submitted', formatDateAndDaysAgo(application?.submittedAt ?? undefined))
  const submittedByRow = () => summaryListRow('Submitted by', application?.createdBy?.name)
  const expiresRow = () => summaryListRow('Application expires', formatDate(application?.expiresAt ?? undefined))
  const requestSubmittedRow = () =>
    summaryListRow('Request submitted', formatDateAndDaysAgo(requestForPlacement?.submittedAt ?? undefined))
  const requestSubmittedByRow = () => summaryListRow('Request submitted by', requestForPlacement?.submittedBy?.name)

  switch (serviceStatus) {
    case 'CAS1_NOT_SUBMITTED':
      return [
        summaryListRow('Application started', formatDateAndDaysAgo(application?.createdAt)),
        summaryListRow('Started by', application?.createdBy?.name),
      ]
    case 'CAS1_SUBMITTED':
    case 'CAS1_INFO_REQUESTED':
      return [submittedRow(), submittedByRow()]
    case 'CAS1_APPLICATION_REJECTED':
      return [
        summaryListRow('Decision', assessment?.rejectionRationale ? `${assessment.rejectionRationale}` : 'Reject'),
        submittedRow(),
        submittedByRow(),
      ]
    case 'CAS1_PLACEMENT_BOOKED':
      return [
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        summaryListRow('Duration', placementDurationText(requestForPlacement?.durationDays)),
        requestSubmittedByRow(),
      ]
    case 'CAS1_ARRIVED':
      return [
        summaryListRow('Arrival date', formatDateAndDaysAgo(placement?.actualArrivalDate ?? undefined)),
        summaryListRow('Expected departure', formatDateAndDaysAgo(placement?.expectedDepartureDate ?? undefined)),
        requestSubmittedByRow(),
      ]
    case 'CAS1_NOT_ARRIVED':
      return [
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'CAS1_PLACEMENT_CANCELLED':
      return [
        summaryListRow('Cancellation reason', placement?.cancellationReason ?? undefined),
        summaryListRow('Expected arrival', formatDateAndDaysAgo(requestForPlacement?.expectedArrivalDate ?? undefined)),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'CAS1_PLACEMENT_REQUEST_NOT_STARTED':
    case 'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED':
      return [submittedByRow(), expiresRow()]
    case 'CAS1_PLACEMENT_REQUEST_SUBMITTED':
      return [requestSubmittedRow(), requestSubmittedByRow(), expiresRow()]
    case 'CAS1_PLACEMENT_REQUEST_REJECTED':
      return [
        summaryListRow('Rejection reason', requestForPlacement?.rejectionReason ?? undefined),
        requestSubmittedRow(),
        requestSubmittedByRow(),
        expiresRow(),
      ]
    case 'CAS1_PLACEMENT_REQUEST_WITHDRAWN':
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

const detailsForCas3Status = (
  serviceResult?: ServiceResultV2,
  cas3Application?: Cas3ApplicationDto,
): SummaryListRow[] => {
  const { serviceStatus } = serviceResult ?? {}
  if (!cas3Application) return []
  switch (serviceStatus) {
    case 'CAS3_NOT_SUBMITTED':
      return [
        summaryListRow('Referral started', formatDateAndDaysAgo(cas3Application.createdAt ?? undefined)),
        summaryListRow('Started by', cas3Application.createdBy?.name ?? undefined),
      ]
    case 'CAS3_SUBMITTED':
      return [
        summaryListRow('Submitted', formatDateAndDaysAgo(cas3Application?.applicationSubmittedDate ?? undefined)),
        summaryListRow('Submitted by', cas3Application?.createdBy.name ?? undefined),
      ]
    case 'CAS3_REJECTED':
      return [
        summaryListRow('Rejection reason', cas3Application?.applicationRejectedReason ?? undefined),
        summaryListRow('Submitted', formatDateAndDaysAgo(cas3Application?.applicationSubmittedDate ?? undefined)),
        summaryListRow('Submitted by', cas3Application?.createdBy.name ?? undefined),
      ]
    case 'CAS3_BEDSPACE_OFFERED':
      return [
        summaryListRow(
          'Provisional offer sent',
          formatDateAndDaysAgo(cas3Application?.bookingProvisionalOfferSentDate ?? undefined),
        ),
        summaryListRow('Referral submitted by', cas3Application?.createdBy.name ?? undefined),
      ]
    case 'CAS3_BOOKING_CONFIRMED': {
      const { premises } = cas3Application ?? {}
      const address = cas3PremisesToAccommodationAddress(premises)
      const duration = placementDurationText(daysBetween(premises?.startDate, premises?.endDate))

      return [
        summaryListRow('Address', address ? formatAddress(address) : undefined),
        summaryListRow(
          'Booking dates',
          `${formatDate(premises?.startDate)} to ${formatDate(premises?.endDate)}${duration ? ` (${duration})` : ''}`,
        ),
        summaryListRow('Referral submitted by', cas3Application?.createdBy.name ?? undefined),
      ]
    }
    case 'CAS3_BOOKING_CANCELLED': {
      const { cancellation, premises, createdBy } = cas3Application
      const bookingDates =
        premises?.startDate && premises.endDate
          ? `${formatDate(premises.startDate)} to ${formatDate(premises.endDate)}`
          : undefined

      return [
        summaryListRow('Cancellation reason', cancellation?.cancellationReason ?? undefined),
        summaryListRow('Booking dates', bookingDates),
        summaryListRow('Referral submitted by', createdBy?.name ?? undefined),
      ]
    }
    case 'CAS3_ARRIVED':
      return [
        summaryListRow('Arrival date', formatDateAndDaysAgo(cas3Application?.premises.startDate ?? undefined)),
        summaryListRow('Expected departure date', formatDateAndDaysAgo(cas3Application?.premises.endDate ?? undefined)),
        summaryListRow('Referral submitted by', cas3Application?.createdBy.name ?? undefined),
      ]
    default:
      return []
  }
}

const statusFields = (serviceResult?: ServiceResultV2): Pick<StatusCard, 'inactive' | 'blocked' | 'status'> => {
  const { serviceStatus } = serviceResult ?? {}

  return {
    inactive: serviceStatus?.includes('NOT_ELIGIBLE') ?? false,
    blocked: serviceStatus?.includes('CANNOT_START_YET') ?? false,
    status: serviceStatusTag(serviceStatus),
  }
}

const statusFieldsForCas2 = (serviceResult?: ServiceResultV2): Pick<StatusCard, 'inactive' | 'blocked' | 'status'> => {
  return statusFields(serviceResult)
}

export const cas1StatusCard = ({
  serviceResult,
  cas1Application,
}: Cas1ServiceResultWrapper): StatusCard | undefined => {
  if (isHiddenForFailureReason(serviceResult, ['NOT_IN_PRISON_OR_CAS1_ACCOMMODATION'])) return undefined

  return {
    heading: 'Approved premises (CAS1)',
    ...statusFields(serviceResult),
    hint: hintForCas1Status(serviceResult),
    links: linksForCas1Status(serviceResult),
    details: detailsForCas1Status(serviceResult, cas1Application),
    content: contentForCas1Status(serviceResult, cas1Application),
  }
}

export const cas2StatusCard = (
  { serviceResult, cas2Application }: Cas2ServiceResultWrapper,
  crn: string,
): StatusCard => ({
  heading: 'Short-term accommodation (CAS2)',
  ...statusFieldsForCas2(serviceResult),
  hint: hintForCas2Status(serviceResult),
  links: linksForCas2Status(serviceResult, cas2Application, crn),
  details: detailsForCas2Status(serviceResult, cas2Application),
  content: contentForCas2Status(serviceResult),
})

export const cas3StatusCard = ({ serviceResult, cas3Application }: Cas3ServiceResultWrapper): StatusCard => ({
  heading: 'CAS3 (transitional accommodation)',
  ...statusFields(serviceResult),
  hint: hintForCas3Status(serviceResult),
  details: detailsForCas3Status(serviceResult, cas3Application),
  links: linksForCas3Status(serviceResult),
  content: contentForCas3Status(serviceResult, cas3Application),
})

export const eligibilityToEligibilityCards = (eligibility: EligibilityV2Dto, crn: string): StatusCard[] =>
  [
    dutyToReferStatusCard(crn, eligibility.dtr),
    crsStatusCard(eligibility.crs),
    cas1StatusCard(eligibility.cas1),
    config.flags.cas2Enabled ? cas2StatusCard(eligibility.cas2, crn) : undefined,
    cas3StatusCard(eligibility.cas3),
  ].filter(Boolean)
