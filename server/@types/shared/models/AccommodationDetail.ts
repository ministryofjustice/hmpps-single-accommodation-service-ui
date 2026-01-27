/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationAddressDetails } from './AccommodationAddressDetails';
export type AccommodationDetail = {
    id: string;
    name?: string;
    arrangementType: 'PRISON' | 'CAS1' | 'CAS2' | 'CAS2V2' | 'CAS3' | 'PRIVATE' | 'NO_FIXED_ABODE';
    arrangementSubType?: 'FRIENDS_OR_FAMILY' | 'SOCIAL_RENTED' | 'PRIVATE_RENTED_WHOLE_PROPERTY' | 'PRIVATE_RENTED_ROOM' | 'OWNED' | 'OTHER';
    arrangementSubTypeDescription?: string;
    settledType: 'SETTLED' | 'TRANSIENT';
    offenderReleaseType?: 'REMAND' | 'LICENCE' | 'BAIL';
    status?: 'NOT_CHECKED_YET' | 'CHECKS_PASSED' | 'CHECKS_FAILED' | 'CONFIRMED';
    address: AccommodationAddressDetails;
    startDate?: string;
    endDate?: string;
    createdAt: string;
};

