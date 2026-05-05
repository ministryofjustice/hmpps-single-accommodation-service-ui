/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Cas1ApplicationDto = {
    id: string;
    applicationStatus: 'AWAITING_ASSESSMENT' | 'UNALLOCATED_ASSESSMENT' | 'ASSESSMENT_IN_PROGRESS' | 'AWAITING_PLACEMENT' | 'PLACEMENT_ALLOCATED' | 'REQUEST_FOR_FURTHER_INFORMATION' | 'PENDING_PLACEMENT_REQUEST' | 'STARTED' | 'REJECTED' | 'INAPPLICABLE' | 'WITHDRAWN' | 'EXPIRED';
    requestForPlacementStatus?: 'REQUEST_UNSUBMITTED' | 'REQUEST_REJECTED' | 'REQUEST_SUBMITTED' | 'AWAITING_MATCH' | 'REQUEST_WITHDRAWN' | 'PLACEMENT_BOOKED';
    placementStatus?: 'ARRIVED' | 'UPCOMING' | 'DEPARTED' | 'NOT_ARRIVED' | 'CANCELLED';
};

