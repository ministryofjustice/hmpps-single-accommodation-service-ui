/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationAddressDetails } from './AccommodationAddressDetails';
export type ProposedAccommodationDetailCommand = {
    name?: string | null;
    accommodationTypeCode: string;
    verificationStatus: 'NOT_CHECKED_YET' | 'FAILED' | 'PASSED';
    nextAccommodationStatus: 'YES' | 'NO' | 'TO_BE_DECIDED';
    address: AccommodationAddressDetails;
    startDate?: string | null;
    endDate?: string | null;
};

