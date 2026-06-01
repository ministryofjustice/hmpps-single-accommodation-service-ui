/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DtrCommand = {
    localAuthorityAreaId: string;
    referenceNumber?: string | null;
    submissionDate: string;
    status: 'NOT_STARTED' | 'SUBMITTED' | 'ACCEPTED' | 'NOT_ACCEPTED' | 'WITHDRAWN';
    withdrawalReason?: 'NEW_REFERRAL' | 'INCORRECT_LOCAL_AUTHORITY' | 'NO_CONSENT' | 'DISENGAGED' | 'HOUSING_NEED_RESOLVED' | 'NOT_ELIGIBLE' | 'OTHER';
    withdrawalReasonOther?: string | null;
};

