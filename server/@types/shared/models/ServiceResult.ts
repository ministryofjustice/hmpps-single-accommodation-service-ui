/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ServiceResult = {
    serviceStatus: 'NOT_ELIGIBLE' | 'UPCOMING' | 'NOT_STARTED' | 'NOT_SUBMITTED' | 'INFO_REQUESTED' | 'REJECTED' | 'WITHDRAWN' | 'SUBMITTED' | 'PLACEMENT_BOOKED' | 'CONFIRMED' | 'NOT_ARRIVED' | 'PLACEMENT_CANCELLED' | 'PLACEMENT_REQUEST_NOT_STARTED' | 'PLACEMENT_REQUEST_WITHDRAWN' | 'PLACEMENT_REQUEST_SUBMITTED' | 'PLACEMENT_REQUEST_REJECTED' | 'APPLICATION_REJECTED' | 'ARRIVED';
    suitableApplicationId?: string;
    action?: string;
    link?: string;
};

