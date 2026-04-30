/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Cas3ApplicationDto = {
    id: string;
    applicationStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'REQUESTED_FURTHER_INFORMATION' | 'REJECTED';
    assessmentStatus?: 'UNALLOCATED' | 'IN_REVIEW' | 'READY_TO_PLACE' | 'CLOSED' | 'REJECTED';
    bookingStatus?: 'PROVISIONAL' | 'CONFIRMED' | 'ARRIVED' | 'NOT_MINUS_ARRIVED' | 'DEPARTED' | 'CANCELLED' | 'CLOSED';
};

