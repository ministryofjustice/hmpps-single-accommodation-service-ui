import { Cas1ApplicationDto, Cas2ApplicationDto, Cas3ApplicationDto, DtrSubmissionDto, ServiceResult } from '@sas/api'

export const exampleDate = (offset: number): string => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

// These are example API states, not rules for how the UI displays them.
export const exampleApplications = (status: ServiceResult['serviceStatus']) => {
  const arrived = status === 'ARRIVED'
  const draft = status === 'NOT_SUBMITTED'
  const cas1ApplicationStates: Partial<
    Record<ServiceResult['serviceStatus'], Cas1ApplicationDto['applicationStatus']>
  > = {
    NOT_SUBMITTED: 'STARTED',
    SUBMITTED: 'AWAITING_ASSESSMENT',
    INFO_REQUESTED: 'REQUESTED_FURTHER_INFORMATION',
    APPLICATION_REJECTED: 'REJECTED',
    PLACEMENT_BOOKED: 'PLACEMENT_ALLOCATED',
    ARRIVED: 'PLACEMENT_ALLOCATED',
    NOT_ARRIVED: 'PLACEMENT_ALLOCATED',
    PLACEMENT_CANCELLED: 'PLACEMENT_ALLOCATED',
  }
  const requestStates: Partial<
    Record<ServiceResult['serviceStatus'], Cas1ApplicationDto['requestForPlacementStatus']>
  > = {
    PLACEMENT_REQUEST_SUBMITTED: 'REQUEST_SUBMITTED',
    PLACEMENT_REQUEST_REJECTED: 'REQUEST_REJECTED',
    PLACEMENT_REQUEST_WITHDRAWN: 'REQUEST_WITHDRAWN',
    PLACEMENT_BOOKED: 'PLACEMENT_BOOKED',
    ARRIVED: 'PLACEMENT_BOOKED',
    NOT_ARRIVED: 'PLACEMENT_BOOKED',
    PLACEMENT_CANCELLED: 'PLACEMENT_BOOKED',
  }
  const placementStates: Partial<Record<ServiceResult['serviceStatus'], Cas1ApplicationDto['placementStatus']>> = {
    PLACEMENT_BOOKED: 'UPCOMING',
    ARRIVED: 'ARRIVED',
    NOT_ARRIVED: 'NOT_ARRIVED',
    PLACEMENT_CANCELLED: 'CANCELLED',
  }
  const cas2AssessmentStates: Partial<
    Record<
      ServiceResult['serviceStatus'],
      NonNullable<Cas2ApplicationDto['submittedApplication']>['latestAssessmentStatus']
    >
  > = {
    MORE_INFORMATION_NEEDED: 'MORE_INFO_REQUESTED',
    AWAITING_DECISION: 'AWAITING_DECISION',
    ON_WAITING_LIST: 'ON_WAITING_LIST',
    PLACE_OFFERED: 'PLACE_OFFERED',
    OFFER_ACCEPTED: 'OFFER_ACCEPTED',
    AWAITING_ARRIVAL: 'AWAITING_ARRIVAL',
    OFFER_DECLINED_OR_WITHDRAWN: 'OFFER_DECLINED',
    CANCELLED: 'CANCELLED',
    WITHDRAWN: 'WITHDRAWN',
  }
  const cas3BookingStates: Partial<Record<ServiceResult['serviceStatus'], Cas3ApplicationDto['bookingStatus']>> = {
    BEDSPACE_OFFERED: 'PROVISIONAL',
    BOOKING_CONFIRMED: 'CONFIRMED',
    BOOKING_CANCELLED: 'CANCELLED',
    ARRIVED: 'ARRIVED',
  }
  let cas3ApplicationStatus: Cas3ApplicationDto['applicationStatus'] = 'SUBMITTED'
  if (draft) cas3ApplicationStatus = 'IN_PROGRESS'
  else if (status === 'REJECTED') cas3ApplicationStatus = 'REJECTED'
  const staff = { name: 'Example practitioner', username: 'example', staffCode: 'EXAMPLE' }
  const start = exampleDate(arrived ? -2 : 14)
  const end = exampleDate((arrived ? -2 : 14) + 84)
  const cas1: Cas1ApplicationDto = {
    id: 'preview',
    uiUrl: '#',
    applicationStatus: cas1ApplicationStates[status] ?? 'PENDING_PLACEMENT_REQUEST',
    application: {
      id: 'preview',
      status: cas1ApplicationStates[status] ?? 'PENDING_PLACEMENT_REQUEST',
      createdAt: exampleDate(-3),
      createdBy: staff,
      submittedAt: draft ? undefined : exampleDate(-2),
      expiresAt: draft ? undefined : exampleDate(180),
    },
    assessment:
      draft || status === 'SUBMITTED' || status === 'INFO_REQUESTED'
        ? undefined
        : {
            decision: status === 'APPLICATION_REJECTED' ? 'REJECTED' : 'ACCEPTED',
            rejectionRationale: status === 'APPLICATION_REJECTED' ? 'Example rejection reason' : undefined,
          },
    requestForPlacement: requestStates[status]
      ? {
          status: requestStates[status],
          submittedAt: exampleDate(-2),
          submittedBy: staff,
          expectedArrivalDate: start,
          durationDays: 84,
          rejectionReason: status === 'PLACEMENT_REQUEST_REJECTED' ? 'Example rejection reason' : undefined,
          withdrawalReason: status === 'PLACEMENT_REQUEST_WITHDRAWN' ? 'CHANGE_IN_CIRCUMSTANCES' : undefined,
        }
      : undefined,
    requestForPlacementStatus: requestStates[status],
    placementStatus: placementStates[status],
    placement: placementStates[status]
      ? {
          status: placementStates[status],
          actualArrivalDate: arrived ? start : undefined,
          expectedDepartureDate: end,
          cancellationReason: status === 'PLACEMENT_CANCELLED' ? 'Example cancellation reason' : undefined,
        }
      : undefined,
    placementHistory: [],
  }
  const cas2: Cas2ApplicationDto = {
    id: 'preview',
    uiUrl: '#',
    createdAt: exampleDate(-3),
    createdBy: { ...staff, userType: 'PROBATION' },
    submittedApplication: draft
      ? undefined
      : {
          latestAssessmentStatus: cas2AssessmentStates[status],
          submittedAt: exampleDate(-2),
          offerDeclinedReason: status === 'OFFER_DECLINED_OR_WITHDRAWN' ? 'Example decline reason' : undefined,
          cancelledReason: status === 'CANCELLED' ? 'Example cancellation reason' : undefined,
        },
  }
  const cas3: Cas3ApplicationDto = {
    id: 'preview',
    uiUrl: '#',
    applicationStatus: cas3ApplicationStatus,
    applicationSubmittedDate: draft ? undefined : exampleDate(-2),
    applicationSubmittedBy: draft ? undefined : staff,
    applicationRejectedReason: status === 'REJECTED' ? 'Example rejection reason' : undefined,
    bookingStatus: cas3BookingStates[status],
    bookingProvisionalOfferSentDate: cas3BookingStates[status] ? exampleDate(-1) : undefined,
    cancellation: status === 'BOOKING_CANCELLED' ? { cancellationReason: 'Example cancellation reason' } : undefined,
    premises: cas3BookingStates[status]
      ? {
          addressLine1: '1 Example Road',
          town: 'Example Town',
          postcode: 'AB1 2CD',
          startDate: start,
          endDate: end,
        }
      : undefined,
  }
  const submission: DtrSubmissionDto = {
    id: 'preview',
    localAuthority: { localAuthorityAreaId: 'example', localAuthorityAreaName: 'Example Council' },
    referenceNumber: 'EXAMPLE-123',
    submissionDate: exampleDate(-2),
    createdAt: exampleDate(-2),
    createdBy: staff.name,
  }
  const noApplication = [
    'NOT_STARTED',
    'NOT_ELIGIBLE',
    'NOT_REQUIRED',
    'UPCOMING',
    'CANNOT_START_YET',
    'UNKNOWN',
  ].includes(status)
  return {
    cas1: noApplication ? undefined : cas1,
    cas2: noApplication ? undefined : cas2,
    cas3: noApplication ? undefined : cas3,
    submission: ['SUBMITTED', 'ACCEPTED', 'NOT_ACCEPTED'].includes(status) ? submission : undefined,
  }
}
