/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddressDetails } from './AddressDetails';
export type AccommodationDetail = {
    type: 'PRISON' | 'CAS1' | 'CAS2' | 'CAS2V2' | 'CAS3' | 'PRIVATE' | 'NO_FIXED_ABODE';
    subType?: 'OWNED' | 'RENTED' | 'LODGING';
    name?: string;
    isSettled?: boolean;
    offenderReleaseType?: 'REMAND' | 'LICENCE' | 'BAIL';
    startDate?: string;
    endDate?: string;
    address?: AddressDetails;
};

