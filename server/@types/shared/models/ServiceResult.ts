/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SuitableApplication } from './SuitableApplication';
export type ServiceResult = {
    serviceStatus: 'NOT_STARTED' | 'NOT_ELIGIBLE' | 'UPCOMING' | 'AWAITING_ASSESSMENT' | 'UNALLOCATED_ASSESSMENT' | 'ASSESSMENT_IN_PROGRESS' | 'AWAITING_PLACEMENT' | 'REQUEST_FOR_FURTHER_INFORMATION' | 'PENDING_PLACEMENT_REQUEST' | 'ARRIVED' | 'UPCOMING_PLACEMENT' | 'DEPARTED' | 'NOT_ARRIVED' | 'CANCELLED';
    suitableApplication?: SuitableApplication;
    actions: Array<string>;
};

