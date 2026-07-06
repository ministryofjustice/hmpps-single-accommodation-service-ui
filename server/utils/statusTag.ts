import { ServiceResult } from '@sas/api'
import { StatusTag } from '@sas/ui'

// eslint-disable-next-line import/prefer-default-export
export const serviceStatusTag = (status?: ServiceResult['serviceStatus']): StatusTag =>
  ({
    NOT_REQUIRED: { text: 'Not required', colour: 'grey' },
    NOT_ELIGIBLE: { text: 'Not eligible', colour: 'grey' },
    CANNOT_START_YET: { text: 'Cannot start yet', colour: 'grey' },
    UPCOMING: { text: 'Upcoming', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'orange' },
    NOT_SUBMITTED: { text: 'Not submitted', colour: 'red' },
    INFO_REQUESTED: { text: 'Info requested', colour: 'yellow' },
    REJECTED: { text: 'Rejected', colour: 'red' },
    WITHDRAWN: { text: 'Withdrawn', colour: 'grey' },
    SUBMITTED: { text: 'Submitted', colour: 'yellow' },
    PLACEMENT_BOOKED: { text: 'Placement booked' },
    CONFIRMED: { text: 'Confirmed', colour: 'green' },
    NOT_ARRIVED: { text: 'Not arrived' },
    PLACEMENT_CANCELLED: { text: 'Placement cancelled' },
    PLACEMENT_REQUEST_NOT_STARTED: { text: 'Placement request not started' },
    PLACEMENT_REQUEST_WITHDRAWN: { text: 'Placement request withdrawn' },
    PLACEMENT_REQUEST_SUBMITTED: { text: 'Placement request submitted' },
    PLACEMENT_REQUEST_REJECTED: { text: 'Placement request rejected' },
    APPLICATION_REJECTED: { text: 'Application rejected' },
    ARRIVED: { text: 'Arrived' },
    BEDSPACE_OFFERED: { text: 'Bedspace offered' },
    BOOKING_CONFIRMED: { text: 'Booking confirmed' },
    BOOKING_CANCELLED: { text: 'Booking cancelled' },
    ACCEPTED: { text: 'Accepted', colour: 'yellow' },
    NOT_ACCEPTED: { text: 'Not accepted', colour: 'grey' },
    COMPLETED: { text: 'Completed', colour: 'green' },
  })[status] || { text: 'Unknown' }
