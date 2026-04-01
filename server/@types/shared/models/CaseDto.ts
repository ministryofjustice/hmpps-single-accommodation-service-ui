/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccommodationDetail } from './AccommodationDetail';
import type { AssignedToDto } from './AssignedToDto';
export type CaseDto = {
    name?: string;
    dateOfBirth?: string;
    crn?: string;
    prisonNumber?: string;
    photoUrl?: string;
    tierScore?: 'A3' | 'A2' | 'A1' | 'B3' | 'B2' | 'B1' | 'C3' | 'C2' | 'C1' | 'D3' | 'D2' | 'D1' | 'A3S' | 'A2S' | 'A1S' | 'B3S' | 'B2S' | 'B1S' | 'C3S' | 'C2S' | 'C1S' | 'D3S' | 'D2S' | 'D1S';
    /**
     * no longer be surfacing this with the new `case-list` endpoint - to be removed soon
     * @deprecated
     */
    tier?: 'A3' | 'A2' | 'A1' | 'B3' | 'B2' | 'B1' | 'C3' | 'C2' | 'C1' | 'D3' | 'D2' | 'D1' | 'A3S' | 'A2S' | 'A1S' | 'B3S' | 'B2S' | 'B1S' | 'C3S' | 'C2S' | 'C1S' | 'D3S' | 'D2S' | 'D1S';
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    pncReference?: string;
    assignedTo?: AssignedToDto;
    currentAccommodation?: AccommodationDetail;
    nextAccommodation?: AccommodationDetail;
    status?: 'RISK_OF_NO_FIXED_ABODE' | 'NO_FIXED_ABODE' | 'TRANSIENT' | 'SETTLED';
    actions: Array<string>;
};

