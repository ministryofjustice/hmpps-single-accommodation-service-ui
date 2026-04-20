/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationAddressDetails } from './AccommodationAddressDetails';
import type { AccommodationStatusDto } from './AccommodationStatusDto';
import type { AccommodationTypeDto } from './AccommodationTypeDto';
export type AccommodationSummaryDto = {
    crn: string;
    startDate?: string | null;
    endDate?: string | null;
    address: AccommodationAddressDetails;
    status?: (AccommodationStatusDto | null);
    type?: (AccommodationTypeDto | null);
};

