import { ServiceResultV2 } from '@sas/api'
import { StatusTag } from '@sas/ui'
import { dutyToReferStatusCard } from './dutyToRefer'
import { serviceStatusTag } from './statusTag'

describe('status tags', () => {
  describe('serviceStatusTag', () => {
    const testCases: { statuses: ServiceResultV2['serviceStatus'][]; tag: StatusTag }[] = [
      { statuses: ['PPC_NOT_STARTED'], tag: { text: 'PPC not started', colour: 'orange' } },
      {
        statuses: ['PPC_COMPLETED_PUBLIC_PROTECTION_REQUIRED'],
        tag: { text: 'PPC completed (public protection required)', colour: 'green' },
      },
      {
        statuses: ['PPC_COMPLETED_PUBLIC_PROTECTION_NOT_REQUIRED'],
        tag: { text: 'PPC completed (public protection not required)', colour: 'green' },
      },
      {
        statuses: [
          'PPC_UPSTREAM_ERROR',
          'CAS1_UPSTREAM_ERROR',
          'CAS2_UPSTREAM_ERROR',
          'CAS3_UPSTREAM_ERROR',
          'CRS_UPSTREAM_ERROR',
          'DTR_UPSTREAM_ERROR',
          'PA_UPSTREAM_ERROR',
        ],
        tag: { text: 'Upstream', colour: 'grey' },
      },
      {
        statuses: ['PPC_NOT_REQUIRED', 'CRS_NOT_REQUIRED', 'DTR_NOT_REQUIRED'],
        tag: { text: 'Not required', colour: 'grey' },
      },
      {
        statuses: ['CAS1_NOT_ELIGIBLE', 'CAS2_NOT_ELIGIBLE', 'CAS3_NOT_ELIGIBLE', 'PA_NOT_ELIGIBLE'],
        tag: { text: 'Not eligible', colour: 'grey' },
      },
      {
        statuses: [
          'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS_ACCOMMODATION',
          'CAS3_CANNOT_START_YET_SUBMIT_DTR_CRS',
          'CAS3_CANNOT_START_YET_SUBMIT_CRS_ACCOMMODATION',
          'CAS3_CANNOT_START_YET_SUBMIT_CRS',
          'CAS3_CANNOT_START_YET_SUBMIT_DTR',
        ],
        tag: { text: 'Cannot start yet', colour: 'grey' },
      },
      {
        statuses: [
          'CAS1_UPCOMING',
          'CAS2_UPCOMING',
          'CAS3_UPCOMING',
          'CRS_UPCOMING_ACCOMMODATION_REFERRAL',
          'CRS_UPCOMING_REFERRAL',
          'DTR_UPCOMING',
        ],
        tag: { text: 'Upcoming', colour: 'yellow' },
      },
      {
        statuses: [
          'CAS1_NOT_STARTED',
          'CAS2_NOT_STARTED',
          'CAS3_NOT_STARTED',
          'CAS3_NOT_STARTED_NEW',
          'CRS_NOT_STARTED_REFERRAL',
          'CRS_NOT_STARTED_ACCOMMODATION_REFERRAL',
          'DTR_NOT_STARTED',
          'PA_NOT_STARTED',
        ],
        tag: { text: 'Not started', colour: 'orange' },
      },
      {
        statuses: ['CAS1_NOT_SUBMITTED', 'CAS2_NOT_SUBMITTED', 'CAS3_NOT_SUBMITTED'],
        tag: { text: 'Not submitted', colour: 'orange' },
      },
      { statuses: ['CAS1_INFO_REQUESTED'], tag: { text: 'Information requested', colour: 'orange' } },
      { statuses: ['CAS3_REJECTED'], tag: { text: 'Rejected', colour: 'orange' } },
      { statuses: ['CAS2_WITHDRAWN'], tag: { text: 'Withdrawn', colour: 'orange' } },
      {
        statuses: ['CAS1_SUBMITTED', 'CAS2_SUBMITTED', 'CAS3_SUBMITTED', 'CRS_SUBMITTED', 'DTR_SUBMITTED'],
        tag: { text: 'Submitted', colour: 'yellow' },
      },
      { statuses: ['CAS1_PLACEMENT_BOOKED'], tag: { text: 'Placement booked', colour: 'green' } },
      { statuses: ['CAS1_NOT_ARRIVED', 'CAS3_NOT_ARRIVED'], tag: { text: 'Not arrived', colour: 'orange' } },
      { statuses: ['CAS1_PLACEMENT_CANCELLED'], tag: { text: 'Placement cancelled', colour: 'orange' } },
      {
        statuses: ['CAS1_PLACEMENT_REQUEST_NOT_STARTED', 'CAS1_PLACEMENT_REQUEST_NOT_SUBMITTED'],
        tag: { text: 'Placement request not started', colour: 'orange' },
      },
      {
        statuses: ['CAS1_PLACEMENT_REQUEST_WITHDRAWN'],
        tag: { text: 'Placement request withdrawn', colour: 'orange' },
      },
      {
        statuses: ['CAS1_PLACEMENT_REQUEST_SUBMITTED'],
        tag: { text: 'Placement request submitted', colour: 'yellow' },
      },
      { statuses: ['CAS1_PLACEMENT_REQUEST_REJECTED'], tag: { text: 'Placement request rejected', colour: 'orange' } },
      { statuses: ['CAS1_APPLICATION_REJECTED'], tag: { text: 'Application rejected', colour: 'orange' } },
      { statuses: ['CAS1_ARRIVED', 'CAS2_ARRIVED', 'CAS3_ARRIVED'], tag: { text: 'Arrived', colour: 'green' } },
      { statuses: ['CAS3_BEDSPACE_OFFERED'], tag: { text: 'Bedspace offered', colour: 'orange' } },
      { statuses: ['CAS3_BOOKING_CONFIRMED'], tag: { text: 'Booking confirmed', colour: 'green' } },
      { statuses: ['CAS3_BOOKING_CANCELLED'], tag: { text: 'Booking cancelled', colour: 'grey' } },
      { statuses: ['DTR_ACCEPTED'], tag: { text: 'Accepted', colour: 'green' } },
      { statuses: ['DTR_NOT_ACCEPTED'], tag: { text: 'Not accepted', colour: 'grey' } },
      { statuses: ['PA_COMPLETED'], tag: { text: 'Completed', colour: 'green' } },
      { statuses: ['CAS2_MORE_INFORMATION_NEEDED'], tag: { text: 'More information needed', colour: 'orange' } },
      { statuses: ['CAS2_AWAITING_DECISION'], tag: { text: 'Awaiting decision', colour: 'yellow' } },
      { statuses: ['CAS2_ON_WAITING_LIST'], tag: { text: 'On waiting list', colour: 'yellow' } },
      { statuses: ['CAS2_PLACE_OFFERED'], tag: { text: 'Place offered', colour: 'yellow' } },
      { statuses: ['CAS2_OFFER_ACCEPTED'], tag: { text: 'Offer accepted', colour: 'yellow' } },
      { statuses: ['CAS2_CANCELLED'], tag: { text: 'Cancelled', colour: 'orange' } },
      { statuses: ['CAS2_AWAITING_ARRIVAL'], tag: { text: 'Awaiting arrival', colour: 'green' } },
      {
        statuses: ['CAS2_OFFER_DECLINED_OR_WITHDRAWN'],
        tag: { text: 'Offer declined or withdrawn', colour: 'orange' },
      },
    ]

    it.each(testCases.flatMap(({ statuses, tag }) => statuses.map(status => ({ status, tag }))))(
      'returns the expected tag for $status',
      ({ status, tag }) => {
        expect(serviceStatusTag(status)).toEqual(tag)
      },
    )

    it('returns an unknown tag when no status is provided', () => {
      expect(serviceStatusTag()).toEqual({ text: 'Unknown' })
    })
  })

  it('uses the V2 tag for a duty to refer eligibility card', () => {
    const card = dutyToReferStatusCard('X123456', {
      serviceResult: { serviceStatus: 'DTR_NOT_REQUIRED', failureReasons: [] },
      actionPosition: -1,
    })

    expect(card.status).toEqual({ text: 'Not required', colour: 'grey' })
  })
})
