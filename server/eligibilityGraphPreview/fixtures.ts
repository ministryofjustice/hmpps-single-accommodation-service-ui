import { Cas1ApplicationDto, Cas2ApplicationDto, Cas3ApplicationDto, DtrSubmissionDto, ServiceResultV2 } from '@sas/api'

export const exampleDate = (offset: number): string => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

// These are example API states, not rules for how the UI displays them.
export const exampleApplications = (status: ServiceResultV2['serviceStatus']) => {
  const arrived = ['CAS1_ARRIVED', 'CAS2_ARRIVED', 'CAS3_ARRIVED'].includes(status)
  const draft = ['CAS1_NOT_SUBMITTED', 'CAS2_NOT_SUBMITTED', 'CAS3_NOT_SUBMITTED'].includes(status)
  const cas1ApplicationStates: Partial<
    Record<ServiceResultV2['serviceStatus'], Cas1ApplicationDto['applicationStatus']>
  > = {
    CAS1_NOT_SUBMITTED: 'STARTED',
    CAS1_SUBMITTED: 'AWAITING_ASSESSMENT',
    CAS1_INFO_REQUESTED: 'REQUESTED_FURTHER_INFORMATION',
    CAS1_APPLICATION_REJECTED: 'REJECTED',
    CAS1_PLACEMENT_BOOKED: 'PLACEMENT_ALLOCATED',
    CAS1_ARRIVED: 'PLACEMENT_ALLOCATED',
    CAS1_NOT_ARRIVED: 'PLACEMENT_ALLOCATED',
    CAS1_PLACEMENT_CANCELLED: 'PLACEMENT_ALLOCATED',
  }
  const requestStates: Partial<
    Record<ServiceResultV2['serviceStatus'], Cas1ApplicationDto['requestForPlacementStatus']>
  > = {
    CAS1_PLACEMENT_REQUEST_SUBMITTED: 'REQUEST_SUBMITTED',
    CAS1_PLACEMENT_REQUEST_REJECTED: 'REQUEST_REJECTED',
    CAS1_PLACEMENT_REQUEST_WITHDRAWN: 'REQUEST_WITHDRAWN',
    CAS1_PLACEMENT_BOOKED: 'PLACEMENT_BOOKED',
    CAS1_ARRIVED: 'PLACEMENT_BOOKED',
    CAS1_NOT_ARRIVED: 'PLACEMENT_BOOKED',
    CAS1_PLACEMENT_CANCELLED: 'PLACEMENT_BOOKED',
  }
  const placementStates: Partial<Record<ServiceResultV2['serviceStatus'], Cas1ApplicationDto['placementStatus']>> = {
    CAS1_PLACEMENT_BOOKED: 'UPCOMING',
    CAS1_ARRIVED: 'ARRIVED',
    CAS1_NOT_ARRIVED: 'NOT_ARRIVED',
    CAS1_PLACEMENT_CANCELLED: 'CANCELLED',
  }
  const cas2AssessmentStates: Partial<
    Record<
      ServiceResultV2['serviceStatus'],
      NonNullable<Cas2ApplicationDto['submittedApplication']>['latestAssessmentStatus']
    >
  > = {
    CAS2_MORE_INFORMATION_NEEDED: 'MORE_INFO_REQUESTED',
    CAS2_AWAITING_DECISION: 'AWAITING_DECISION',
    CAS2_ON_WAITING_LIST: 'ON_WAITING_LIST',
    CAS2_PLACE_OFFERED: 'PLACE_OFFERED',
    CAS2_OFFER_ACCEPTED: 'OFFER_ACCEPTED',
    CAS2_AWAITING_ARRIVAL: 'AWAITING_ARRIVAL',
    CAS2_OFFER_DECLINED_OR_WITHDRAWN: 'OFFER_DECLINED',
    CAS2_CANCELLED: 'CANCELLED',
    CAS2_WITHDRAWN: 'WITHDRAWN',
  }
  const cas3BookingStates: Partial<Record<ServiceResultV2['serviceStatus'], Cas3ApplicationDto['bookingStatus']>> = {
    CAS3_BEDSPACE_OFFERED: 'PROVISIONAL',
    CAS3_BOOKING_CONFIRMED: 'CONFIRMED',
    CAS3_BOOKING_CANCELLED: 'CANCELLED',
    CAS3_ARRIVED: 'ARRIVED',
  }
  let cas3ApplicationStatus: Cas3ApplicationDto['applicationStatus'] = 'SUBMITTED'
  if (draft) cas3ApplicationStatus = 'IN_PROGRESS'
  else if (status === 'CAS3_REJECTED') cas3ApplicationStatus = 'REJECTED'
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
      draft || status === 'CAS1_SUBMITTED' || status === 'CAS1_INFO_REQUESTED'
        ? undefined
        : {
            decision: status === 'CAS1_APPLICATION_REJECTED' ? 'REJECTED' : 'ACCEPTED',
            rejectionRationale: status === 'CAS1_APPLICATION_REJECTED' ? 'Example rejection reason' : undefined,
          },
    requestForPlacement: requestStates[status]
      ? {
          status: requestStates[status],
          submittedAt: exampleDate(-2),
          submittedBy: staff,
          expectedArrivalDate: start,
          durationDays: 84,
          rejectionReason: status === 'CAS1_PLACEMENT_REQUEST_REJECTED' ? 'Example rejection reason' : undefined,
          withdrawalReason: status === 'CAS1_PLACEMENT_REQUEST_WITHDRAWN' ? 'CHANGE_IN_CIRCUMSTANCES' : undefined,
        }
      : undefined,
    requestForPlacementStatus: requestStates[status],
    placementStatus: placementStates[status],
    placement: placementStates[status]
      ? {
          status: placementStates[status],
          actualArrivalDate: arrived ? start : undefined,
          expectedDepartureDate: end,
          cancellationReason: status === 'CAS1_PLACEMENT_CANCELLED' ? 'Example cancellation reason' : undefined,
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
          offerDeclinedReason: status === 'CAS2_OFFER_DECLINED_OR_WITHDRAWN' ? 'Example decline reason' : undefined,
          cancelledReason: status === 'CAS2_CANCELLED' ? 'Example cancellation reason' : undefined,
        },
  }
  const cas3: Cas3ApplicationDto = {
    id: 'preview',
    uiUrl: '#',
    createdAt: exampleDate(-3),
    applicationStatus: cas3ApplicationStatus,
    applicationSubmittedDate: draft ? undefined : exampleDate(-2),
    createdBy: draft ? undefined : staff,
    applicationRejectedReason: status === 'CAS3_REJECTED' ? 'Example rejection reason' : undefined,
    bookingStatus: cas3BookingStates[status],
    bookingProvisionalOfferSentDate: cas3BookingStates[status] ? exampleDate(-1) : undefined,
    cancellation:
      status === 'CAS3_BOOKING_CANCELLED' ? { cancellationReason: 'Example cancellation reason' } : undefined,
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
    'CAS1_NOT_STARTED',
    'CAS2_NOT_STARTED',
    'CAS3_NOT_STARTED',
    'CAS3_NOT_STARTED_NEW',
    'CRS_NOT_STARTED_REFERRAL',
    'CRS_NOT_STARTED_ACCOMMODATION_REFERRAL',
    'DTR_NOT_STARTED',
    'PA_NOT_STARTED',
    'PPC_NOT_STARTED',
    'CAS1_UPCOMING',
    'CAS2_UPCOMING',
    'CAS3_UPCOMING',
    'DTR_UPCOMING',
    'CRS_UPCOMING_REFERRAL',
    'CRS_UPCOMING_ACCOMMODATION_REFERRAL',
    'CAS3_CANNOT_START_YET_SUBMIT_DTR',
    'CAS3_CANNOT_START_YET_SUBMIT_CRS',
    'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS',
    'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION',
    'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION',
    'CAS1_NOT_ELIGIBLE',
    'CAS2_NOT_ELIGIBLE',
    'CAS3_NOT_ELIGIBLE',
    'PA_NOT_ELIGIBLE',
    'PPC_NOT_REQUIRED',
    'DTR_NOT_REQUIRED',
    'CRS_NOT_REQUIRED',
    'PPC_UPSTREAM_ERROR',
    'CAS1_UPSTREAM_ERROR',
    'CAS2_UPSTREAM_ERROR',
    'CAS3_UPSTREAM_ERROR',
    'DTR_UPSTREAM_ERROR',
    'CRS_UPSTREAM_ERROR',
    'PA_UPSTREAM_ERROR',
  ].includes(status)
  return {
    cas1: noApplication ? undefined : cas1,
    cas2: noApplication ? undefined : cas2,
    cas3: noApplication ? undefined : cas3,
    submission: ['DTR_SUBMITTED', 'DTR_ACCEPTED', 'DTR_NOT_ACCEPTED'].includes(status) ? submission : undefined,
  }
}
